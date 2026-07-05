
import sys
import re

path = 'src/components/Apps/Chat.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

new_chat_themes = """const DEFAULT_CHAT_THEMES: ChatTheme[] = [
  {
    id: 'imessage-v3',
    name: '🔵 iMessage 极简 (高清直出)',
    css: `/* 【iMessage 极简大师模板】 */

/* 1. 顶部栏 (Header) */
.chat-window-header { 
  background: rgba(255, 255, 255, 0.7) !important; 
  backdrop-filter: blur(20px) saturate(180%);
  height: 88px !important;
  border-bottom: 0.5px solid rgba(0,0,0,0.1) !important;
  display: flex !important;
  flex-direction: column !important;
  align-items: center !important;
  justify-content: flex-end !important;
  padding-bottom: 12px !important;
}
.chat-window-header h2 { 
  font-size: 13px !important; 
  font-weight: 500 !important; 
  color: #000 !important;
}
.chat-window-header h2::before {
  content: 'iMessage';
  display: block;
  font-size: 10px;
  color: #8e8e93;
  font-weight: 400;
  margin-bottom: 2px;
}

/* 2. 底部栏 (Footer) */
.chat-window-footer { 
  background: rgba(255,255,255,0.8) !important; 
  backdrop-filter: blur(20px);
  padding: 8px 16px 24px !important;
  border-top: none !important;
}
.chat-input-area { 
  background: #ffffff !important; 
  border: 1px solid #d1d1d6 !important; 
  border-radius: 22px !important;
}
.send-button { 
  background: #007aff !important; 
  border-radius: 50% !important; 
}
.send-button::after { content: '↑'; color: #fff; font-weight: bold; }

/* 3. 头像 (Avatar) */
.chat-avatar { 
  border-radius: 50% !important; 
  border: 1px solid rgba(0,0,0,0.05) !important;
  width: 36px !important;
  height: 36px !important;
}

/* 4. 角色气泡 (Assistant Bubble) */
.message-bubble-assistant { 
  background-color: #e9e9eb !important; 
  color: #000 !important; 
  border-radius: 20px !important;
  padding: 10px 16px !important;
  border: none !important;
  margin-left: 8px !important;
  position: relative !important;
}
.message-bubble-assistant::before {
  content: '';
  position: absolute;
  bottom: 0;
  left: -8px;
  width: 20px;
  height: 20px;
  background-color: #e9e9eb;
  border-bottom-right-radius: 15px;
  z-index: -1;
}

/* 5. 用户气泡 (User Bubble) */
.message-bubble-user { 
  background: linear-gradient(180deg, #057eff 0%, #02d0fd 100%) !important; 
  color: #fff !important; 
  border-radius: 20px !important;
  padding: 10px 16px !important;
  border: none !important;
  box-shadow: 0 1px 2px rgba(0,0,0,0.1) !important;
  position: relative !important;
}
.message-bubble-user::after {
  content: '';
  position: absolute;
  bottom: 0;
  right: -8px;
  width: 20px;
  height: 20px;
  background: linear-gradient(180deg, #057eff 0%, #02d0fd 100%);
  border-bottom-left-radius: 15px;
  z-index: -1;
}

/* 6. 转账卡片 (Transfer Card) */
.message-type-transfer {
  background: #f2f2f7 !important;
  border-radius: 14px !important;
  color: #000 !important;
  border: 1px solid #d1d1d6 !important;
}
.message-type-transfer .text-orange-500 { color: #007aff !important; }`
  },
  {
    id: 'wechat-v4',
    name: '🍏 微信全能 3.0 (极速版)',
    css: `/* 【微信 3.0 全能模板】 */

/* 1. 顶部栏 (Header) */
.chat-window-header { 
  background: #ededed !important; 
  height: 64px !important; 
  border-bottom: 0.5px solid #d6d6d6 !important; 
}
.chat-window-header h2 { font-size: 17px !important; font-weight: 600 !important; }

/* 2. 底部栏 (Footer) */
.chat-window-footer { 
  background: #f7f7f7 !important; 
  border-top: 0.5px solid #dcdcdc !important; 
}
.chat-input-area { background: #fff !important; border-radius: 4px !important; }
.send-button { background: #07c160 !important; color: #fff !important; border-radius: 4px !important; }

/* 3. 头像 (Avatar) */
.chat-avatar { 
  border-radius: 4px !important; 
  width: 44px !important; 
  height: 44px !important; 
}

/* 4. 角色气泡 (Assistant Bubble) */
.message-bubble-assistant { 
  background: #ffffff !important; 
  color: #000 !important; 
  border-radius: 6px !important; 
  position: relative !important;
  border: none !important;
  padding: 10px 14px !important;
  margin-left: 10px !important;
}
.message-bubble-assistant::after { 
  content: ''; position: absolute; left: -6px; top: 12px; border: 6px solid transparent; border-right-color: #ffffff; 
}

/* 5. 用户气泡 (User Bubble) */
.message-bubble-user { 
  background: #95ec69 !important; 
  color: #000 !important; 
  border-radius: 6px !important; 
  position: relative !important;
  border: none !important;
  padding: 10px 14px !important;
  margin-right: 10px !important;
}
.message-bubble-user::after { 
  content: ''; position: absolute; right: -6px; top: 12px; border: 6px solid transparent; border-left-color: #95ec69; 
}

/* 6. 转账卡片 (Transfer Card) */
.message-type-transfer {
  background: #fa9d3b !important; 
  border-radius: 12px !important;
  color: #ffffff !important;
}
.message-type-transfer .bg-orange-500 { background: transparent !important; }`
  },
  {
    id: 'cream-yellow-v3',
    name: '🍮 奶黄甜点大师 2.0',
    css: `/* 【奶黄甜点美化模板】 */

/* 1. 顶部栏 (Header) */
.chat-window-header { 
  background: #fff9db !important; 
  height: 72px !important; 
  border-bottom: 3px solid #ffec99 !important; 
}
.chat-window-header h2 { color: #856404 !important; font-family: serif !important; font-size: 20px !important; }

/* 2. 底部栏 (Footer) */
.chat-window-footer { 
  background: #fff9db !important; 
  border-top: 2px solid #ffec99 !important; 
}
.chat-input-area { background: #fff !important; border: 2px solid #ffec99 !important; border-radius: 14px !important; }
.send-button { background: #fab005 !important; border-radius: 10px !important; }

/* 3. 头像 (Avatar) */
.chat-avatar { 
  border-radius: 14px !important; 
  border: 4px solid #fff !important; 
  box-shadow: 0 0 0 2px #ffec99 !important; 
}

/* 4. 角色气泡 (Assistant Bubble) */
.message-bubble-assistant { 
  background: #ffffff !important; 
  color: #495057 !important; 
  border-radius: 20px 20px 20px 4px !important; 
  border: 2px solid #f1f3f5 !important; 
  padding: 10px 16px !important;
  box-shadow: 2px 2px 0px #f1f3f5 !important;
}

/* 5. 用户气泡 (User Bubble) */
.message-bubble-user { 
  background: #fff3bf !important; 
  color: #856404 !important; 
  border-radius: 20px 20px 4px 20px !important; 
  border: 2px solid #ffec99 !important; 
  padding: 10px 16px !important;
  box-shadow: -2px 2px 0px #ffec99 !important;
}

/* 6. 转账卡片 (Transfer Card) */
.message-type-transfer {
  background: #fff9db !important;
  border: 2px solid #ffec99 !important;
  border-radius: 16px !important;
  color: #856404 !important;
}
.message-type-transfer .bg-orange-500 { background: #fab005 !important; }`
  }
];

const DEFAULT_BUBBLE_THEMES: ChatTheme[] = [
  {
    id: 'bubble-wechat-v3',
    name: '🍏 微信经典',
    css: `/* 【微信 3.0 气泡中心模板】 */

/* 1. 角色气泡 (Assistant Bubble) */
.message-bubble-assistant { 
  background: #ffffff !important; 
  color: #000 !important; 
  border-radius: 6px !important; 
  position: relative !important;
  border: none !important;
  padding: 10px 14px !important;
  margin-left: 10px !important;
}
.message-bubble-assistant::after { 
  content: ''; position: absolute; left: -6px; top: 12px; border: 6px solid transparent; border-right-color: #ffffff; 
}

/* 2. 用户气泡 (User Bubble) */
.message-bubble-user { 
  background: #95ec69 !important; 
  color: #000 !important; 
  border-radius: 6px !important; 
  position: relative !important;
  border: none !important;
  padding: 10px 14px !important;
  margin-right: 10px !important;
}
.message-bubble-user::after { 
  content: ''; position: absolute; right: -6px; top: 12px; border: 6px solid transparent; border-left-color: #95ec69; 
}`
  },
  {
    id: 'bubble-qq-v2',
    name: '🐧 QQ 简约',
    css: `/* 【QQ 简约气泡模板】 */

/* 1. 角色气泡 (Assistant Bubble) */
.message-bubble-assistant { 
  background: #f1f2f6 !important; 
  color: #000 !important; 
  border-radius: 18px !important; 
  padding: 10px 16px !important;
  border: none !important;
}

/* 2. 用户气泡 (User Bubble) */
.message-bubble-user { 
  background: #0099ff !important; 
  color: #ffffff !important; 
  border-radius: 18px !important; 
  padding: 10px 16px !important;
  border: none !important;
}`
  }
];"""

# Replace the theme arrays
start_marker = 'const DEFAULT_CHAT_THEMES: ChatTheme[] = ['
end_marker = '];' # This is tricky as there are many ];
# Better end marker: find where DEFAULT_BUBBLE_THEMES ends.

pattern = re.compile(re.escape(start_marker) + r'.*?' + re.escape('const DEFAULT_BUBBLE_THEMES: ChatTheme[] = [') + r'.*?' + re.escape('];'), re.DOTALL)

if pattern.search(content):
    new_content = pattern.sub(new_chat_themes, content)
    with open('src/components/Apps/Chat.tsx', 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("Themes successfully updated.")
else:
    print("Could not find theme definitions to update.")
    sys.exit(1)
