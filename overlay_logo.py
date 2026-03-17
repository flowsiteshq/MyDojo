from PIL import Image
import os

def overlay_logo(image_path, logo_path, output_path, coordinates, scale_factor=0.15):
    try:
        # Open the background image
        background = Image.open(image_path).convert("RGBA")
        bg_width, bg_height = background.size

        # Open the logo image
        logo = Image.open(logo_path).convert("RGBA")
        
        # Calculate new logo size based on background width
        logo_width = int(bg_width * scale_factor)
        aspect_ratio = logo.height / logo.width
        logo_height = int(logo_width * aspect_ratio)
        
        # Resize logo
        logo = logo.resize((logo_width, logo_height), Image.Resampling.LANCZOS)
        
        # Create a transparent layer for the logo
        transparent_layer = Image.new("RGBA", background.size, (0, 0, 0, 0))
        
        # Paste the logo onto the transparent layer at the specified coordinates
        # Coordinates are (x, y) of the top-left corner
        transparent_layer.paste(logo, coordinates, mask=logo)
        
        # Composite the images
        final_image = Image.alpha_composite(background, transparent_layer)
        
        # Convert back to RGB for JPEG saving
        final_image = final_image.convert("RGB")
        
        # Save the result
        final_image.save(output_path, quality=95)
        print(f"Successfully saved: {output_path}")
        
    except Exception as e:
        print(f"Error processing {image_path}: {str(e)}")

# Paths
base_dir = "/home/ubuntu/mydojo-website/client/public/images"
logo_path = "/home/ubuntu/upload/Untitleddesign(3).png"

# Image configurations: (filename, (x, y), scale)
# Coordinates are estimated based on the visual inspection of the images
# hero-boy: Chest is roughly center-right
# hero-girl: Chest is center
# hero-group: Multiple kids, target the center kid's chest

configs = [
    {
        "input": "hero-boy-victory-mobile.jpg",
        "output": "hero-boy-victory-mobile.jpg",
        "pos": (650, 580), # Adjusted for chest placement
        "scale": 0.18
    },
    {
        "input": "hero-kickboxing-girl-mobile.jpg",
        "output": "hero-kickboxing-girl-mobile.jpg",
        "pos": (450, 580), # Adjusted for chest placement
        "scale": 0.16
    },
    {
        "input": "hero-kickboxing-group-mobile.jpg",
        "output": "hero-kickboxing-group-mobile.jpg",
        "pos": (360, 580), # Center kid
        "scale": 0.14
    }
]

for config in configs:
    input_path = os.path.join(base_dir, config["input"])
    output_path = os.path.join(base_dir, config["output"])
    overlay_logo(input_path, logo_path, output_path, config["pos"], config["scale"])
