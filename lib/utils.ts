import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

function convertShortHexToLong(hex: string) {
  if(/^#[0-9A-F]{3}$/i.test(hex)) {
    return '#' + hex.substring(1).split('').map(char => char + char).join('');
  } else {
    return hex;
  }
}

export const getTextColor = (hex: string) => {
  hex = convertShortHexToLong(hex);
  const threshold = 130;
  
  function cutHex(h: string) {return (h.charAt(0)=="#") ? h.substring(1,7):h}
  const cBrightness = ((parseInt((cutHex(hex)).substring(0,2),16) * 299) + (parseInt((cutHex(hex)).substring(2,4),16) * 587) + (parseInt((cutHex(hex)).substring(4,6),16) * 114)) / 1000;
  if (cBrightness > threshold) { return "black"; } else { return "white"; }	
}

export const modifyColor = (color: string, percent: number) => {
  color = convertShortHexToLong(color);
  var num = parseInt(color.replace("#",""),16),
  amt = Math.round(2.55 * percent),
  R = (num >> 16) + amt,
  B = (num >> 8 & 0x00FF) + amt,
  G = (num & 0x0000FF) + amt;
  return "#" + (0x1000000 + (R<255?R<1?0:R:255)*0x10000 + (B<255?B<1?0:B:255)*0x100 + (G<255?G<1?0:G:255)).toString(16).slice(1);
}