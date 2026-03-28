import os

def force_quote_csv(filename):
    if not os.path.exists(filename):
        print(f"⚠️ 找不到文件 {filename}")
        return

    fixed_rows = []
    with open(filename, 'r', encoding='utf-8') as f:
        lines = f.readlines()
        
    for i, line in enumerate(lines):
        line = line.strip()
        if not line:
            continue
            
        # 1. 识别并严格保留表头
        if i == 0 and "text" in line and "x_score" in line:
            fixed_rows.append("text,x_score,y_score")
            continue
            
        # 2. 从右往左切分
        parts = line.split(',')
        if len(parts) >= 3:
            y_score = parts[-1].strip()
            x_score = parts[-2].strip()
            
            # 把前面所有的文本拼起来
            text = ','.join(parts[:-2]).strip()
            
            # 剥掉 AI 可能原本就带的引号，防止双重嵌套（变 """这样"""）
            if text.startswith('"') and text.endswith('"'):
                text = text[1:-1]
                
            # ⭐️ 核心暴力美学：强制套上 ""，不管里面有没有逗号！
            fixed_rows.append(f'"{text}",{x_score},{y_score}')
        else:
            print(f"⚠️ 第 {i+1} 行格式彻底损坏，已跳过: {line}")

    # 3. 覆盖写回原文件
    with open(filename, 'w', encoding='utf-8') as f:
        for row in fixed_rows:
            f.write(row + '\n')
            
    print(f"✅ {filename} 暴力修复完毕！所有文本第一项已强制套上双引号。")

# 一键修复
force_quote_csv('cn.csv')
force_quote_csv('en.csv')