# Gun.Lol Clone - Complete Profile Website

A fully open-source, customizable profile website inspired by **gun.lol** and **gunslol-open-source**. Features multiple themes, animated backgrounds, music, skills display, projects showcase, and much more!

## Preview

![Preview](https://img.shields.io/badge/Status-Ready-brightgreen) ![License](https://img.shields.io/badge/License-MIT-blue) ![Version](https://img.shields.io/badge/Version-1.0-orange)

## Features

- **Multiple Themes**: 5 different themes (Home, Hacker, Rain, Anime, Car)
- **Animated Backgrounds**: Video backgrounds for each theme
- **Background Music**: Custom music for each theme
- **Custom Cursor**: Animated cursor with glow effects
- **Profile Display**: Animated name, bio, badges, and stats
- **Skills Section**: Animated skill bars with percentages
- **Projects Section**: Showcase your projects
- **Visitor Counter**: Tracks unique visitors
- **Social Links**: GitHub, Discord, YouTube, TikTok, Twitter
- **Settings Panel**: Customize username, bio, and theme color
- **Keyboard Shortcuts**: Quick navigation with keyboard
- **Responsive Design**: Works on all devices
- **Touch Support**: Full touch device compatibility
- **Glassmorphism UI**: Modern glass effect design

## Quick Start

1. **Clone or Download** this repository
2. **Add your assets** to the `assets/` folder (see below)
3. **Open `index.html`** in your browser with a live server

## Required Assets

Create an `assets/` folder and add the following files:

### Background Videos (MP4/MOV)
- `background.mp4` - Default background
- `hacker_background.mp4` - Hacker theme background
- `rain_background.mov` - Rain theme background
- `anime_background.mp4` - Anime theme background
- `car_background.mp4` - Car theme background

### Background Music (MP3)
- `background_music.mp3` - Default music
- `hacker_music.mp3` - Hacker theme music
- `rain_music.mp3` - Rain theme music
- `anime_music.mp3` - Anime theme music
- `car_music.mp3` - Car theme music

### Profile Images
- `profile.gif` - Your profile picture (GIF recommended)

### Badge Icons
- `developer.png` - Developer badge
- `verified.gif` - Verified badge
- `partner.gif` - Partner badge
- `owner.gif` - Owner badge

### Social Icons
- `github.png` - GitHub icon
- `discord.png` - Discord icon
- `youtube.png` - YouTube icon
- `tiktok.png` - TikTok icon
- `twitter.png` - Twitter icon

### Skill Icons
- `python.png` - Python icon
- `cpp.png` - C++ icon
- `csharp.png` - C# icon
- `javascript.png` - JavaScript icon

## Customization

### Change Username & Bio
1. Open `script.js`
2. Edit the `CONFIG` object:
```javascript
const CONFIG = {
    username: 'YourUsername',
    bioMessages: [
        'Your first bio message',
        'Your second bio message'
    ],
    // ... other settings
};
```

Or use the **Settings Panel** (click the gear icon or press `S`):
- Change username
- Change bio
- Change theme color

### Change Skills
Edit the `skills` object in `CONFIG`:
```javascript
skills: {
    python: 95,
    cpp: 88,
    csharp: 82,
    javascript: 90,
    html: 98,
    git: 85
}
```

### Change Stats
Edit these values in `CONFIG`:
```javascript
followersCount: '10K',
projectsCount: '25',
yearsCount: '5+'
```

### Change Theme Colors
Each theme has predefined colors. To change them:
1. Open `style.css`
2. Find the theme color definitions:
```css
body.home-theme {
    --primary-color: #00CED1;
    --secondary-color: #FF6B9E;
}
```

Or use the color picker in the Settings Panel.

### Add More Themes
1. Add a new theme class in `style.css`
2. Add the theme to the `themeMap` in `script.js`
3. Add a button for the theme

### Add More Skills
1. Add the skill HTML in `index.html`
2. Add the skill to the `CONFIG.skills` object
3. Add the skill bar element

### Add More Projects
Edit the projects section in `index.html`:
```html
<div class="project-card">
    <div class="project-icon">&#128187;</div>
    <h3 class="project-name">Project Name</h3>
    <p class="project-desc">Project description</p>
    <a href="#" class="project-link" target="_blank">View Project</a>
</div>
```

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| 1 | Home Theme |
| 2 | Hacker Theme |
| 3 | Rain Theme |
| 4 | Anime Theme |
| 5 | Car Theme |
| M | Toggle Mute |
| S | Toggle Settings |
| ESC | Close Settings |

## Browser Support

- Chrome (Recommended)
- Firefox
- Safari
- Edge
- Mobile browsers (with touch support)

## Tools to Get Assets

### Convert YouTube Videos to MP4/MP3
- [ClipConverter.cc](https://www.clipconverter.cc/)
- [YTMP3.cc](https://ytmp3.cc/)
- [OnlineVideoConverter.com](https://www.onlinevideoconverter.com/)

### Free Icons
- [Flaticon](https://www.flaticon.com/)
- [Font Awesome](https://fontawesome.com/)
- [IconFinder](https://www.iconfinder.com/)

### Free GIFs
- [GIPHY](https://giphy.com/)
- [Tenor](https://tenor.com/)

## Project Structure

```
gunlol-clone/
├── index.html          # Main HTML file
├── style.css           # All styles
├── script.js           # All JavaScript
├── README.md           # Documentation
└── assets/             # All media files
    ├── background.mp4
    ├── hacker_background.mp4
    ├── rain_background.mov
    ├── anime_background.mp4
    ├── car_background.mp4
    ├── background_music.mp3
    ├── hacker_music.mp3
    ├── rain_music.mp3
    ├── anime_music.mp3
    ├── car_music.mp3
    ├── profile.gif
    ├── developer.png
    ├── verified.gif
    ├── partner.gif
    ├── owner.gif
    ├── github.png
    ├── discord.png
    ├── youtube.png
    ├── tiktok.png
    ├── twitter.png
    ├── python.png
    ├── cpp.png
    ├── csharp.png
    └── javascript.png
```

## Tips

1. **Use a Live Server**: Open with VS Code Live Server or similar for best experience
2. **Optimize Videos**: Keep video files under 10MB for faster loading
3. **Compress Images**: Use tools like TinyPNG to compress images
4. **Test on Mobile**: Make sure it works well on touch devices
5. **Custom Fonts**: Add custom fonts in the CSS for unique styling

## Credits

- Inspired by [gun.lol](https://gun.lol)
- Based on [gunslol-open-source](https://github.com/JAQLIV/gunslol-open-source)
- Fonts: Google Fonts (Orbitron, Space Mono)

## License

MIT License - Feel free to use, modify, and distribute!

## Support

- Join our Discord: [discord.gg/motiongoats](https://discord.gg/motiongoats)
- Buy me a coffee: BTC: `bc1qzu5sdzydwh3sulsd25rs57rpn4czyrctm4neph`

---

**Enjoy building your own Gun.Lol style profile website!**
