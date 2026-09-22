# Sign board background artwork

Source: https://www.figma.com/design/2yU4ley6gw6hGPMWOzT7lU/LED-Banner?node-id=278-2125
Retrieved: 2026-09-08. PNG exports of the original Figma frames, including authored header text/icons and white body. No redraw or temporary remote asset dependency.

| Preset | Landscape asset / node | Portrait asset / node |
| --- | --- | --- |
| nameBg | Name_BG_1_A.png / 1159:1531 | Name_BG_1_B.png / 1159:1536 |
| locationBg | Location_BG_1_A.png / 1162:1588 | Location_BG_1_B.png / 1162:1596 |
| todayBg | Today_BG_1_A.png / 1162:1628 | Today_BG_1_B.png / 1162:1636 |

Landscape: 852 × 393. Portrait: 393 × 852. The Figma A frames have transformed local coordinates; the exported PNGs are already upright. Do not rotate them again.

Body bounds: landscape x=20..832, y=100..373; portrait x=20..373, y=120..832. Text uses additional interior padding. Existing frame fill behavior is used across phone/tablet dimensions; actual device rendering is unverified.

## Runtime frame assets

The six original PNG exports above are retained as recoverable source masters. Runtime rendering and Settings thumbnails use the corresponding `*_Frame.png` files. These derived files preserve the authored header, icon and colored border while making only the connected white body transparent, so the selected photo or background remains visible inside the frame.

| Runtime asset | Original bytes | Runtime bytes | Transparent body pixels |
| --- | ---: | ---: | ---: |
| Name_BG_1_A_Frame.png | 6,665 | 6,332 | 221,568 |
| Name_BG_1_B_Frame.png | 7,301 | 6,674 | 251,228 |
| Location_BG_1_A_Frame.png | 11,084 | 10,834 | 221,596 |
| Location_BG_1_B_Frame.png | 11,042 | 10,433 | 251,256 |
| Today_BG_1_A_Frame.png | 139,589 | 132,867 | 221,572 |
| Today_BG_1_B_Frame.png | 114,295 | 108,370 | 251,232 |

Dimensions and orientation are unchanged. Static photo composites and alpha bounds were reviewed on 2026-09-22; app/device rendering of these derived assets remains pending a new build.
