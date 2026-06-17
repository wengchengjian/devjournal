---
title: "Windows 默认浏览器每天重启后被篡改 — 排查与修复全记录"
description: "排查 Windows 默认浏览器每天重启后被篡改的问题，提供修复方法。"
pubDate: 2026-06-16
tags: ["Windows"]
---

# Windows 默认浏览器每天重启后被篡改 — 排查与修复全记录

> **环境**：Windows 11 24H2 (Build 26100.7171)
> **症状**：每天重启后，打开链接要么被改成 Edge，要么（卸载 Edge 后）弹窗要求重新设置默认应用
> **期望**：默认浏览器始终为 Google Chrome
> **日期**：2026-06-17

---

## 一、问题现象

| 阶段            | 现象                                                                    |
| --------------- | ----------------------------------------------------------------------- |
| 安装 Edge 时    | 每次重启后默认浏览器被改成 **Edge**                                     |
| 卸载 Edge 后    | 每次重启后打开任何链接 → **弹窗"如何打开此链接"**，要求重新设置默认应用 |
| 手动设回 Chrome | 当时可用，但**次日重启后必然复发**                                      |

关键线索：问题在安装腾讯电脑管家**之前**就已存在，可排除它作为根因。

---

## 二、排查过程

### 第 1 步：检查当前关联状态

查询 `http` / `https` / `.html` 的 UserChoice 注册表项：

```
HKCU\Software\Microsoft\Windows\Shell\Associations\UrlAssociations\http\UserChoice
    ProgId = ChromeHTML   Hash = IQBHpy+pU48=
```

**此刻状态正常**（都是 ChromeHTML），说明问题不是"持续被锁"，而是"每次开机后被重置一次"。

### 第 2 步：排除组策略 / MDM / Edge 策略

检查以下位置，**全部为空**，排除企业策略强制下发：

- `HKLM\Software\Policies\Microsoft\Windows\Explorer`
- `HKLM\SOFTWARE\Policies\Microsoft\Windows\System\DefaultAssociationsConfiguration`
- `HKLM\SOFTWARE\Policies\Microsoft\Edge`

### 第 3 步：发现 UserChoice 注册表权限异常（Deny 锁）

对比四个 UserChoice 键的 ACL，发现 `.htm` / `.html` / `.pdf` 三个键存在异常：

| 注册表键           | Owner                 | Deny 规则                        |
| ------------------ | --------------------- | -------------------------------- |
| `http\UserChoice`  | 当前用户 ✅           | 无 ✅                            |
| `https\UserChoice` | 当前用户 ✅           | 无 ✅                            |
| `.htm\UserChoice`  | **Administrators** ⚠️ | **Deny SetValue（当前用户）** ⚠️ |
| `.html\UserChoice` | **Administrators** ⚠️ | **Deny SetValue（当前用户）** ⚠️ |
| `.pdf\UserChoice`  | **Administrators** ⚠️ | **Deny SetValue（当前用户）** ⚠️ |

**病理分析**：正常的 UserChoice 键 Owner 应是用户本人，无 Deny 项。这三个键被某个"默认应用锁定"工具（历史残留）破坏 —— Deny 规则阻止了系统刷新 Hash，导致每次开机关联失效。

### 第 4 步：清除 Deny 锁（部分成功）

由于 Deny 规则优先级高于 Allow，常规管理员权限的 `Set-Acl` 失败。最终通过 **.NET `RegistryKey` API + 显式启用 `SeTakeOwnershipPrivilege`** 成功清理：

```
打开键 (TakeOwnership 权限) → SetOwner(当前用户) → 重读 ACL
→ 移除所有 Deny 规则 → SetAccessControl → 删除键
```

| 键                 | 结果                                                             |
| ------------------ | ---------------------------------------------------------------- |
| `.htm\UserChoice`  | ✅ Deny 移除 + 删除成功                                          |
| `.html\UserChoice` | ✅ Deny 移除 + 删除成功                                          |
| `.pdf\UserChoice`  | ⚠️ 值清空成功（DACL 锁连 SYSTEM 都无法改，但值清空后等同无选择） |

### 第 5 步：重启验证 — 发现真正的作恶机制

清除 Deny 锁后重启，**问题依旧**！而且关联被改成了更可疑的值：

| 关联  | 修复后     | **重启后**                       |
| ----- | ---------- | -------------------------------- |
| http  | ChromeHTML | ⚠️ **MSEdgeHTM**                 |
| https | ChromeHTML | ChromeHTML                       |
| .htm  | 已删除     | ⚠️ **MSEdgeHTM**（被重新写入！） |
| .html | 已删除     | ⚠️ **MSEdgeHTM**（被重新写入！） |

**决定性发现**：`MSEdgeHTM` 这个 ProgID **在系统中根本不存在**（Edge 已卸载），但有服务在开机时把它写进 UserChoice，且能算出有效 Hash。

### 第 6 步：监控日志锁定作恶时段

部署 SYSTEM 身份的开机监控任务，日志显示：

```
17:40:32 === POLL START ===
17:40:32 initial: MSEdgeHTM, MSEdgeHTM, MSEdgeHTM   ← 登录前就已经是 MSEdgeHTM
17:40:32 initial suspects: explorer, msedgewebview2, MSPCManagerService, QQPCRTP
```

**篡改发生在登录前的服务启动阶段**，由 SYSTEM 身份的常驻服务完成。两个嫌疑服务：

| 服务                                           | 来源                        | 启动方式  | 身份        |
| ---------------------------------------------- | --------------------------- | --------- | ----------- |
| `PCManager Service Store` (MSPCManagerService) | 微软电脑管家 3.21.7.0       | Automatic | LocalSystem |
| `QQPCRTP`                                      | 腾讯电脑管家 18.2.30554.201 | Automatic | LocalSystem |

两者都有"默认浏览器保护/锁定"功能，开机时会按内部记录恢复默认浏览器为 Edge（`MSEdgeHTM`）。

---

## 三、根因总结

```
开机
 ↓
管家服务（MSPCManagerService / QQPCRTP）启动
 ↓
执行"默认浏览器保护"：把 UserChoice 写成 MSEdgeHTM（带有效 Hash）
 ↓
但 Edge 已卸载 → MSEdgeHTM ProgID 不存在
 ↓
打开链接时系统找不到处理程序 → 弹窗要求重选
```

---

## 四、解决方案：釜底抽薪

### 思路

无法阻止管家服务开机写 `MSEdgeHTM`（它是 SYSTEM 权限的常驻服务）。但可以让 `MSEdgeHTM` 这个 ProgID **指向 Chrome** —— 这样无论谁设默认为 MSEdgeHTM，最终都走 Chrome。

### 实施

**1. 创建指向 Chrome 的 MSEdgeHTM ProgID**

```cmd
reg add "HKCU\Software\Classes\MSEdgeHTM" /ve /d "Chrome HTML" /f
reg add "HKCU\Software\Classes\MSEdgeHTM\shell\open\command" /ve /d "\"C:\Program Files\Google\Chrome\Application\chrome.exe\" --single-argument %%1" /f
reg add "HKCU\Software\Classes\MSEdgeHTM\DefaultIcon" /ve /d "C:\Program Files\Google\Chrome\Application\chrome.exe,0" /f
```

**2. 同样处理 MSEdgePDF**

```cmd
reg add "HKCU\Software\Classes\MSEdgePDF" /ve /d "PDF Document" /f
reg add "HKCU\Software\Classes\MSEdgePDF\shell\open\command" /ve /d "\"C:\Program Files\Google\Chrome\Application\chrome.exe\" --single-argument %%1" /f
```

**3. 部署开机自愈任务（防止 ProgID 被删除）**

计划任务 `EnsureChromeRedirect`，触发器 = AtStartup，以 SYSTEM 运行，脚本内容：

```powershell
# ensure-chrome-redirect.ps1
$sid = 'S-1-5-21-590298938-4008070625-1087970625-1001'  # 当前用户 SID
$chrome = '"C:\Program Files\Google\Chrome\Application\chrome.exe" --single-argument %1'
$log = 'C:\Users\wengchengjian\ZCodeProject\ensure-chrome-redirect.log'

foreach($progId in 'MSEdgeHTM','MSEdgePDF'){
    $base = "Registry::HKEY_USERS\$sid\Software\Classes\$progId"
    if(-not (Test-Path $base)){ New-Item -Path $base -Force | Out-Null }
    Set-ItemProperty -Path $base -Name '(default)' -Value 'Google Chrome' -Type String
    $cmdKey = "$base\shell\open\command"
    if(-not (Test-Path $cmdKey)){ New-Item -Path $cmdKey -Force | Out-Null }
    Set-ItemProperty -Path $cmdKey -Name '(default)' -Value $chrome -Type String
    "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') ensured $progId -> Chrome" | Out-File $log -Append
}
```

注册任务：

```powershell
$action = New-ScheduledTaskAction -Execute 'powershell.exe' `
    -Argument '-NoProfile -ExecutionPolicy Bypass -File C:\Users\wengchengjian\ZCodeProject\ensure-chrome-redirect.ps1'
$trigger = New-ScheduledTaskTrigger -AtStartup
$principal = New-ScheduledTaskPrincipal -UserId 'SYSTEM' -LogonType ServiceAccount -RunLevel Highest
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable
Register-ScheduledTask -TaskName 'EnsureChromeRedirect' -Action $action -Trigger $trigger -Principal $principal -Settings $settings -Force
```

### 方案优势

| 对比项        | 卸载管家软件 | 关闭保护功能      | **釜底抽薪（本方案）** |
| ------------- | ------------ | ----------------- | ---------------------- |
| 需要卸载/禁用 | ✅ 是        | ✅ 是             | ❌ 否                  |
| 影响其他功能  | ✅ 会        | ✅ 可能           | ❌ 不会                |
| 作恶服务还在  | ❌ 已移除    | ❌ 还在           | ✅ 还在但无害          |
| 重启复发      | ❌ 不会      | ⚠️ 可能被重新开启 | ❌ 不会（有自愈）      |
| 实施成本      | 中           | 低                | **低**                 |

---

## 五、验证结果

| 验证点          | 结果                                      |
| --------------- | ----------------------------------------- |
| 修复后打开链接  | ✅ 直接 Chrome                            |
| 重启后打开链接  | ✅ 直接 Chrome（已二次验证）              |
| 自愈任务运行    | ✅ 日志确认 `ensured MSEdgeHTM -> Chrome` |
| UserChoice 状态 | `MSEdgeHTM`（管家设的）→ 重定向到 Chrome  |

---

## 六、附录

### 涉及的注册表位置

| 路径                                                                                  | 说明                   |
| ------------------------------------------------------------------------------------- | ---------------------- |
| `HKCU\Software\Microsoft\Windows\Shell\Associations\UrlAssociations\http\UserChoice`  | http 协议默认应用      |
| `HKCU\Software\Microsoft\Windows\Shell\Associations\UrlAssociations\https\UserChoice` | https 协议默认应用     |
| `HKCU\Software\Microsoft\Windows\CurrentVersion\Explorer\FileExts\.html\UserChoice`   | .html 文件默认应用     |
| `HKCU\Software\Classes\MSEdgeHTM\shell\open\command`                                  | **本方案创建的重定向** |
| `HKCU\Software\Classes\MSEdgePDF\shell\open\command`                                  | **本方案创建的重定向** |

### Windows UserChoice 机制要点

- UserChoice 的 `ProgId` 值必须配合系统计算的 `Hash`，手写 Hash 无效（每个 Windows build 算法不同）
- `Hash` 与用户 SID、扩展名、时间戳绑定
- 当 UserChoice 引用的 ProgId **不存在**时，系统回退到弹窗选择
- Deny 规则优先级高于 Allow，会阻止系统自身刷新 Hash
- `.NET RegistryKey.SetAccessControl` 配合 `SeTakeOwnershipPrivilege` 可突破 Deny 锁

### 排查中排除的干扰项

- ❌ 组策略 GPO / MDM（策略键为空）
- ❌ Edge 浏览器自身策略抢占（无策略键）
- ❌ 腾讯电脑管家单独作为根因（装它之前问题已存在）
- ❌ Chrome 注册不完整（ProgID、Capabilities 全部正常）
- ❌ Run / RunOnce 启动项脚本篡改

### 生成文件清单

| 文件                                                                 | 用途                            |
| -------------------------------------------------------------------- | ------------------------------- |
| `C:\Users\wengchengjian\ZCodeProject\ensure-chrome-redirect.ps1`     | **核心：开机自愈脚本（保留）**  |
| `C:\Users\wengchengjian\ZCodeProject\fix-default-browser-process.md` | 本文档                          |
| `C:\Users\wengchengjian\ZCodeProject\fix-default-browser.ps1`        | Deny 锁清除脚本（诊断用，可删） |
| `C:\Users\wengchengjian\ZCodeProject\verify-status.ps1`              | 状态核对脚本（诊断用，可删）    |
| 计划任务 `EnsureChromeRedirect`                                      | **核心：开机自愈任务（保留）**  |

---

## 七、可选的彻底根治

若希望从源头消除作恶服务（而非重定向绕过），可在对应软件内关闭功能：

- **微软电脑管家**：设置 → 关闭"默认浏览器保护"/"浏览器保护"
- **腾讯电脑管家**：工具箱 → 浏览器保护 → 关闭"默认浏览器锁定"

但有了釜底抽薪方案 + 自愈任务，**即使不关这些功能也不会再弹窗**。
