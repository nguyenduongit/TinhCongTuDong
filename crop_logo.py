import cv2
import numpy as np
from PIL import Image
import os
import sys

def process_logo(input_path, output_dir):
    print(f"Processing {input_path}...")
    img = cv2.imread(input_path)
    
    # Chuyển sang grayscale
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    
    # Lọc ra các pixel không phải nền đen/xám tối (ngưỡng 40)
    _, thresh = cv2.threshold(gray, 40, 255, cv2.THRESH_BINARY)
    
    # Tìm bounding box của các pixel màu sáng (viền vàng)
    contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    if not contours:
        print("Could not find any content to crop!")
        return
        
    # Tìm bounding box lớn nhất (chính là cái khung vàng)
    c = max(contours, key=cv2.contourArea)
    x, y, w, h = cv2.boundingRect(c)
    
    # Make it a perfect square
    size = max(w, h)
    center_x, center_y = x + w//2, y + h//2
    
    # Tính tọa độ mới (vuông)
    new_x = max(0, center_x - size//2)
    new_y = max(0, center_y - size//2)
    
    # Cắt ảnh gốc
    cropped = img[new_y:new_y+size, new_x:new_x+size]
    
    # Đảm bảo là hình vuông hoàn hảo (trong trường hợp bị lệch ở biên ảnh)
    cropped_square = cv2.resize(cropped, (1024, 1024), interpolation=cv2.INTER_AREA)
    
    # Convert BGR to BGRA (thêm kênh alpha)
    rgba = cv2.cvtColor(cropped_square, cv2.COLOR_BGR2BGRA)
    
    # Làm trong suốt 4 góc bên ngoài viền vàng
    # Tìm contours lại trên ảnh đã crop
    crop_gray = cv2.cvtColor(cropped_square, cv2.COLOR_BGR2GRAY)
    _, crop_thresh = cv2.threshold(crop_gray, 40, 255, cv2.THRESH_BINARY)
    crop_contours, _ = cv2.findContours(crop_thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if crop_contours:
        c_crop = max(crop_contours, key=cv2.contourArea)
        # Tạo mask
        mask = np.zeros_like(crop_gray)
        cv2.drawContours(mask, [c_crop], -1, 255, -1)
        
        # Áp dụng mask vào kênh alpha
        rgba[:, :, 3] = mask
    
    # Lưu ra các kích thước
    img_pil = Image.fromarray(cv2.cvtColor(rgba, cv2.COLOR_BGRA, cv2.COLOR_BGR2RGBA))
    # Hoặc nếu bị sai màu thì chỉ cần: 
    # Nhưng opencv trả về BGRA, convert sang RGBA cho PIL
    img_pil = Image.fromarray(cv2.cvtColor(rgba, cv2.COLOR_BGRA2RGBA))
    
    os.makedirs(output_dir, exist_ok=True)
    
    # Lưu các size
    sizes = {
        'icon-192.png': 192,
        'icon-512.png': 512,
        'apple-touch-icon.png': 180,
    }
    
    for name, size in sizes.items():
        resized = img_pil.resize((size, size), Image.Resampling.LANCZOS)
        out_path = os.path.join(output_dir, name)
        resized.save(out_path, "PNG")
        print(f"Saved {out_path}")
        
    print("Done!")

if __name__ == "__main__":
    import glob
    # Lấy file ảnh mới nhất trong thư mục Downloads của người dùng
    downloads_path = os.path.expanduser("~/Downloads")
    gemini_images = glob.glob(os.path.join(downloads_path, "Gemini_Generated_Image*.png"))
    gemini_images += glob.glob(os.path.join(downloads_path, "Gemini_Generated_Image*.jpg"))
    gemini_images += glob.glob(os.path.join(downloads_path, "IMG_*.jpeg"))
    
    if not gemini_images:
        print("No image found!")
        sys.exit(1)
        
    latest_img = max(gemini_images, key=os.path.getmtime)
    process_logo(latest_img, "public")

