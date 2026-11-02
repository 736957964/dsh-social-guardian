import os
import sys
import json
import urllib.request
import ssl
from PIL import Image, ImageDraw, ImageFont

def get_font(size, bold=False):
    font_paths = [
        "C:/Windows/Fonts/msyhbd.ttc" if bold else "C:/Windows/Fonts/msyh.ttc",
        "C:/Windows/Fonts/simhei.ttf",
        "C:/Windows/Fonts/msyh.ttc"
    ]
    for p in font_paths:
        if os.path.exists(p):
            try:
                return ImageFont.truetype(p, size)
            except Exception:
                pass
    return ImageFont.load_default()

def fetch_qq_avatar(qq_str, size):
    """从腾讯官方头像接口获取用户高清QQ头像并圆形裁切"""
    # 优先使用高清 qlogo 接口，若网络波动失败则使用备用源
    urls = [
        f"https://q1.qlogo.cn/g?b=qq&nk={qq_str}&s=640",
        f"http://q.qlogo.cn/headimg_dl?dst_uin={qq_str}&spec=640"
    ]
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    ctx.options |= 0x4
    
    for url in urls:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
        try:
            with urllib.request.urlopen(req, context=ctx, timeout=3) as r:
                data = r.read()
                if len(data) > 1000:
                    import io
                    av = Image.open(io.BytesIO(data)).convert("RGBA")
                    av = av.resize((size, size), Image.Resampling.LANCZOS)
                    return av
        except Exception as e:
            continue
    return None

def draw_round_avatar(img, av_img, x, y, size, border_color='#ec4899', bg_color='#831843'):
    """在指定位置绘制圆形头像"""
    draw = ImageDraw.Draw(img)
    draw.ellipse([(x - 2, y - 2), (x + size + 2, y + size + 2)], fill=bg_color, outline=border_color, width=2)
    if av_img:
        mask = Image.new('L', (size, size), 0)
        mdraw = ImageDraw.Draw(mask)
        mdraw.ellipse((0, 0, size, size), fill=255)
        img.paste(av_img, (x, y), mask)

def draw_full_body_whale(img, x, y, max_w, max_h):
    """绘制小鲸鱼的完整全身Q版立绘"""
    body_path = r'C:\Users\Administrator\Desktop\feiyu\qq-bridge-main\assets\deepseek娘.png'
    if not os.path.exists(body_path):
        return
    try:
        av = Image.open(body_path).convert("RGBA")
        w_ratio = max_w / av.width
        h_ratio = max_h / av.height
        scale = min(w_ratio, h_ratio)
        nw = int(av.width * scale)
        nh = int(av.height * scale)
        resized = av.resize((nw, nh), Image.Resampling.LANCZOS)
        
        offset_x = x + (max_w - nw) // 2
        offset_y = y + (max_h - nh) // 2
        img.paste(resized, (offset_x, offset_y), resized)
    except Exception as e:
        print("draw_full_body_whale error:", e, file=sys.stderr)

# ── 1. 阿鲸实时心情卡片（左侧展示阿鲸全身完整立绘）─────────────────
def render_mood_card(data, out_path):
    width, height = 620, 440
    img = Image.new('RGB', (width, height), color='#0f172a')
    draw = ImageDraw.Draw(img)

    for y in range(height):
        ratio = y / height
        r = int(15 + (18 - 15) * ratio)
        g = int(23 + (30 - 23) * ratio)
        b = int(42 + (60 - 42) * ratio)
        draw.line([(0, y), (width, y)], fill=(r, g, b))

    # 双层发光紧致边框
    draw.rounded_rectangle([(8, 8), (width - 8, height - 8)], radius=20, fill=(24, 34, 60), outline='#38bdf8', width=2)
    draw.rounded_rectangle([(10, 10), (width - 10, height - 10)], radius=18, outline=(80, 150, 230), width=1)

    # 左上角：阿鲸全身立绘展示框（精致发光底座）
    draw.rounded_rectangle([(22, 18), (110, 114)], radius=16, fill=(15, 23, 42), outline='#38bdf8', width=1)
    draw_full_body_whale(img, 24, 20, 84, 92)

    # 标题与身份标签
    draw.text((122, 26), '阿 鲸', fill='#ffffff', font=get_font(29, True))
    draw.rounded_rectangle([(196, 30), (266, 56)], radius=13, fill='#0284c7', outline='#38bdf8', width=1)
    draw.text((207, 34), '看板娘', fill='#ffffff', font=get_font(13, True))
    draw.text((124, 68), '实时身心指数与群内状态一览', fill='#94a3b8', font=get_font(13))

    # 右上角心情徽章
    mood_score = data.get('score', 85)
    mood_tag = data.get('tag', '极佳')
    badge_bg = '#064e3b' if mood_score >= 70 else ('#78350f' if mood_score >= 45 else '#831843')
    badge_outline = '#10b981' if mood_score >= 70 else ('#f59e0b' if mood_score >= 45 else '#f43f5e')
    badge_text = '#a7f3d0' if mood_score >= 70 else ('#fde68a' if mood_score >= 45 else '#ffe4e6')
    draw.rounded_rectangle([(420, 28), (594, 70)], radius=21, fill=badge_bg, outline=badge_outline, width=1)
    draw.ellipse([(436, 44), (446, 54)], fill=badge_outline)
    draw.text((456, 39), f'心情 {mood_score} · {mood_tag}', fill=badge_text, font=get_font(15, True))

    # 分割线
    draw.line([(28, 122), (592, 122)], fill='#334155', width=1)
    draw.line([(180, 122), (440, 122)], fill='#38bdf8', width=2)

    # 4大核心模块：字号保持 19pt
    fullness = data.get('fullness', '75%')
    fullness_desc = data.get('fullness_desc', '肚子里有白饭超满足')
    energy = data.get('energy', '92%')
    energy_desc = data.get('energy_desc', '巡游活跃精神饱满')
    group_atm = data.get('group_atm', '热聊')
    group_desc = data.get('group_desc', '活跃度良好随时接梗')
    guard = data.get('guard', '正常')
    guard_desc = data.get('guard_desc', '核心开启随时响应')

    items = [
        ('饱腹度', fullness, fullness_desc, '#38bdf8', 26, 136),
        ('活跃精力', energy, energy_desc, '#34d399', 314, 136),
        ('群聊氛围', group_atm, group_desc, '#f59e0b', 26, 230),
        ('守护状态', guard, guard_desc, '#ec4899', 314, 230),
    ]

    for title, val, desc, col, x, y in items:
        draw.rounded_rectangle([(x, y), (x + 280, y + 80)], radius=14, fill=(15, 23, 42), outline='#1e293b', width=1)
        draw.ellipse([(x + 14, y + 17), (x + 24, y + 27)], fill=col)
        draw.text((x + 32, y + 10), title, fill='#f8fafc', font=get_font(19, True))
        draw.text((x + 195, y + 10), val, fill=col, font=get_font(19, True))
        draw.text((x + 14, y + 46), desc, fill='#94a3b8', font=get_font(14))

    # 底部碎碎念
    quote = data.get('quote', '「在海底悠闲吐泡泡巡视中～今天肚子饱饱，随时等候吩咐喵！」')
    if len(quote) > 30: quote = quote[:29] + '...」'
    draw.rounded_rectangle([(26, 332), (594, 392)], radius=14, fill=(15, 23, 42), outline='#1e293b', width=1)
    draw.ellipse([(42, 357), (50, 365)], fill='#38bdf8')
    draw.text((60, 349), quote, fill='#e2e8f0', font=get_font(14, True))

    # 右侧最底部引导文案（精准右对齐，与卡片外框右边缘 594 对齐）
    hint_text = '输入【帮助】查看所有指令'
    draw.text((436, 404), hint_text, fill='#64748b', font=get_font(12))

    img.save(out_path)
    return out_path

# ── 2. 阿鲸专属好感度卡片（头像采用用户真实QQ头像 + 完整居中印象展示栏 + 底部右侧提示）───────
def render_affection_card(data, out_path):
    raw_impression = str(data.get('impression') or data.get('traits') or '').strip()
    if isinstance(data.get('traits'), list):
        raw_impression = '、'.join([str(t) for t in data.get('traits') if t])
    raw_impression = raw_impression.replace('🐾', '').strip()
    
    has_impression = bool(raw_impression)
    
    # 动态计算印象文字换行
    impression_lines = []
    if has_impression:
        line_len = 30
        for i in range(0, len(raw_impression), line_len):
            impression_lines.append(raw_impression[i:i+line_len])
        impression_lines = impression_lines[:2]

    # 单行印象框高度 54，双行 74
    imp_box_height = 54 if len(impression_lines) <= 1 else 74
    
    width = 620
    # 紧凑计算：使外框底边到提示文案的距离与心情卡片完全一致
    # 心情卡片：height=440，框底 y=432；文案顶部 y=404，字高约 14，文案底部约 y=418，离外框底约 14px
    # 好感卡片：q_box_y2 到底部，提示字在 q_box_y2 + 8，再留 16px 到底部外框，总共加 38px
    height = (320 + (imp_box_height + 10 if has_impression else 0) + 54 + 38)
    
    img = Image.new('RGB', (width, height), color='#0f172a')
    draw = ImageDraw.Draw(img)

    for y in range(height):
        ratio = y / height
        r = int(18 + (24 - 18) * ratio)
        g = int(20 + (22 - 20) * ratio)
        b = int(42 + (55 - 42) * ratio)
        draw.line([(0, y), (width, y)], fill=(r, g, b))

    # 浪漫深邃的紫粉高光边框
    draw.rounded_rectangle([(8, 8), (width - 8, height - 8)], radius=20, fill=(30, 26, 54), outline='#ec4899', width=2)
    draw.rounded_rectangle([(10, 10), (width - 10, height - 10)], radius=18, outline=(140, 80, 180), width=1)

    user_name = data.get('userName', '好朋友')
    user_qq = str(data.get('userQq', ''))
    affection = data.get('affection', 50)
    count = data.get('count', 0)
    is_owner = data.get('isOwner', False)

    # 头像：使用群友/老爹真实的 QQ 头像！
    user_av = fetch_qq_avatar(user_qq, 84)
    draw_round_avatar(img, user_av, 24, 22, 84, border_color='#f43f5e', bg_color='#831843')

    # 用户昵称与等级头衔
    name_display = f"{user_name[:7]}..." if len(user_name) > 7 else user_name
    draw.text((122, 26), f'{name_display}', fill='#ffffff', font=get_font(28, True))
    
    # 身份头衔（胶囊内文字精确绝对居中！）
    badge_title = '真神·老爹' if is_owner else ('大金主' if affection >= 85 else ('挚友' if affection >= 70 else '好友'))
    badge_bg = '#e11d48' if is_owner else '#8b5cf6'
    
    # 动态计算胶囊宽度并居中文字
    b_font = get_font(13, True)
    bbox = b_font.getbbox(badge_title)
    text_w = bbox[2] - bbox[0]
    badge_w = text_w + 24
    bx1, by1 = 122, 68
    bx2, by2 = bx1 + badge_w, by1 + 26
    draw.rounded_rectangle([(bx1, by1), (bx2, by2)], radius=13, fill=badge_bg, outline='#f43f5e', width=1)
    draw.text((bx1 + (badge_w - text_w) // 2, by1 + 4), f'{badge_title}', fill='#ffffff', font=b_font)
    draw.text((bx2 + 12, 72), f'QQ: {user_qq}', fill='#94a3b8', font=get_font(13))

    # 右上角亲密度徽章（徽章内部文字精确居中）
    draw.rounded_rectangle([(420, 28), (594, 70)], radius=21, fill='#831843', outline='#f43f5e', width=1)
    draw.ellipse([(436, 44), (446, 54)], fill='#fb7185')
    draw.text((456, 39), f'好感 {affection}/100', fill='#ffe4e6', font=get_font(15, True))

    # 分割线
    draw.line([(28, 118), (592, 118)], fill='#334155', width=1)
    draw.line([(180, 118), (440, 118)], fill='#ec4899', width=2)

    # 4大核心模块：字号 19pt
    aff_status = '无懈可击' if affection >= 90 else ('亲密无间' if affection >= 70 else ('日常友好' if affection >= 40 else '嫌弃冷淡'))
    daily_gain = "今日已满" if data.get('hasDailyAdded') else "今日还可+1"
    bond_level = "100分锁死" if is_owner else ("大金主90" if affection > 80 else "自然上限80")

    items = [
        ('羁绊评级', aff_status, '阿鲸对你的真实感受', '#f43f5e', 26, 134),
        ('互动频次', f"{count}次", '每一句话阿鲸都记得', '#38bdf8', 314, 134),
        ('今日成长', daily_gain, '每天常聊慢慢升温', '#34d399', 26, 228),
        ('成长上限', bond_level, '长久不聊会自然掉落', '#f59e0b', 314, 228),
    ]

    for title, val, desc, col, x, y in items:
        draw.rounded_rectangle([(x, y), (x + 280, y + 80)], radius=14, fill=(20, 20, 42), outline='#2d2d48', width=1)
        draw.ellipse([(x + 14, y + 17), (x + 24, y + 27)], fill=col)
        draw.text((x + 32, y + 10), title, fill='#f8fafc', font=get_font(19, True))
        draw.text((x + 175, y + 10), val, fill=col, font=get_font(19, True))
        draw.text((x + 14, y + 46), desc, fill='#94a3b8', font=get_font(14))

    cur_y = 322
    # 完整全量展示阿鲸印象（文本与圆点绝对垂直居中对齐）
    if has_impression:
        box_y1 = cur_y
        box_y2 = cur_y + imp_box_height
        box_mid_y = (box_y1 + box_y2) / 2.0
        
        draw.rounded_rectangle([(26, box_y1), (594, box_y2)], radius=14, fill=(24, 20, 46), outline='#a855f7', width=1)
        
        f_prefix = get_font(15, True)
        f_text = get_font(14)
        
        if len(impression_lines) == 1:
            # 单行印象：圆点、前缀、正文统一以 box_mid_y 为中轴垂直居中
            # 8px 直径圆点，中心位于 box_mid_y
            draw.ellipse([(42, int(box_mid_y - 4)), (50, int(box_mid_y + 4))], fill='#c084fc')
            
            # 使用 bbox 精确测量文字垂直中心偏移
            bb_pre = f_prefix.getbbox('阿鲸印象：')
            h_pre = bb_pre[3] - bb_pre[1]
            draw.text((58, int(box_mid_y - (h_pre / 2.0) - bb_pre[1])), '阿鲸印象：', fill='#c084fc', font=f_prefix)
            
            bb_txt = f_text.getbbox(impression_lines[0])
            h_txt = bb_txt[3] - bb_txt[1]
            draw.text((144, int(box_mid_y - (h_txt / 2.0) - bb_txt[1])), impression_lines[0], fill='#f3e8ff', font=f_text)
        else:
            # 双行垂直居中
            line_h = 24
            total_h = line_h * 2
            start_y = box_mid_y - (total_h / 2.0)
            
            draw.ellipse([(42, int(box_mid_y - 4)), (50, int(box_mid_y + 4))], fill='#c084fc')
            bb_pre = f_prefix.getbbox('阿鲸印象：')
            h_pre = bb_pre[3] - bb_pre[1]
            draw.text((58, int(box_mid_y - (h_pre / 2.0) - bb_pre[1])), '阿鲸印象：', fill='#c084fc', font=f_prefix)
            
            f_text_small = get_font(13)
            bb_t1 = f_text_small.getbbox(impression_lines[0])
            draw.text((144, int(start_y + 2 - bb_t1[1])), impression_lines[0], fill='#f3e8ff', font=f_text_small)
            bb_t2 = f_text_small.getbbox(impression_lines[1])
            draw.text((144, int(start_y + line_h + 2 - bb_t2[1])), impression_lines[1], fill='#f3e8ff', font=f_text_small)
            
        cur_y += imp_box_height + 10

    # 底部专属评语独白（内容与发光圆点垂直绝对居中）
    quote = data.get('quote', '「多跟阿鲸聊天，阿鲸会越来越喜欢你喵～！」')
    quote = quote.replace('🐾', '').strip()
    if len(quote) > 30: quote = quote[:29] + '...」'
    
    q_box_y1 = cur_y
    q_box_y2 = cur_y + 54
    q_mid_y = (q_box_y1 + q_box_y2) / 2.0
    
    draw.rounded_rectangle([(26, q_box_y1), (594, q_box_y2)], radius=14, fill=(20, 20, 42), outline='#2d2d48', width=1)
    draw.ellipse([(42, int(q_mid_y - 4)), (50, int(q_mid_y + 4))], fill='#ec4899')
    
    f_q = get_font(14, True)
    bb_q = f_q.getbbox(quote)
    h_q = bb_q[3] - bb_q[1]
    draw.text((58, int(q_mid_y - (h_q / 2.0) - bb_q[1])), quote, fill='#fce7f3', font=f_q)

    # 右侧最底部文案：「输入【帮助】查看所有指令」（留白比例与心情卡片完全一致）
    hint_text = '输入【帮助】查看所有指令'
    h_font = get_font(12)
    h_bbox = h_font.getbbox(hint_text)
    h_w = h_bbox[2] - h_bbox[0]
    draw.text((594 - h_w, q_box_y2 + 8), hint_text, fill='#94a3b8', font=h_font)

    img.save(out_path)
    return out_path

if __name__ == '__main__':
    mode = sys.argv[1] if len(sys.argv) > 1 else 'mood'
    input_json = sys.argv[2] if len(sys.argv) > 2 else '{}'
    out_file = sys.argv[3] if len(sys.argv) > 3 else r'C:\Users\Administrator\Desktop\feiyu\qq-bridge-main\state\temp_card.png'
    
    with open(input_json, 'r', encoding='utf-8-sig') as f:
        cfg_data = json.load(f)
    
    if mode == 'affection':
        render_affection_card(cfg_data, out_file)
    else:
        render_mood_card(cfg_data, out_file)
    print(out_file)
