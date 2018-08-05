import hexToHsl from 'hex-to-hsl';
import hslToHex from 'hsl-to-hex';

export const colors = {
    yellow: '#fdff00',
    pink: '#ea82e5',
    blue: '#46bfee',
    red: '#d03e19',
    orange: '#db851c'
};

// Use functions to tweak colors, rather than keeping track of all of the hexcodes
// HSL L - black = 0, white = 1
export const lighter = (color, percent = 5) =>
    updateHexLum(color, percent > 0 ? percent : -percent);

export const darker = (color, percent = -5) =>
    updateHexLum(color, percent < 0 ? percent : -percent);

const updateHexLum = (color, percent = 5) => {
    const [hue, saturation, luminosity] = hexToHsl(color);
    return hslToHex(hue, saturation, luminosity + percent);
};
