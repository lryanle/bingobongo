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

export const hexToRgb = (hex: string) => {
  hex = hex.replace(/^#/, '');

  if (hex.length === 3) {
    hex = hex.split('').map(char => char + char).join('');
  }

  if (hex.length !== 6 || !/^[0-9A-Fa-f]{6}$/.test(hex)) {
    throw new Error('Invalid HEX color.');
  }

  return `${parseInt(hex.slice(0, 2), 16)},${parseInt(hex.slice(2, 4), 16)},${parseInt(hex.slice(4, 6), 16)}`;
}

type SanitizeInput = string;
export const sanitize = <T extends SanitizeInput>(input: T): T extends SanitizeInput ? string : never => {
  const map: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    "/": '&#x2F;',
  };
  const reg = /[&<>"'/]/ig;
  return (input as SanitizeInput).replace(reg, (match) => (map[match])) as any;
}

export const isJson = (str: any) => {
  if (typeof str !== 'string') return false;
    try {
        const result = JSON.parse(str);
        const type = Object.prototype.toString.call(result);
        return type === '[object Object]' 
            || type === '[object Array]';
    } catch (err) {
        return false;
    }
}

export const getAllValues = (obj: any) => {
  let values: string[] = [];

  function extractValues(item: any) {
      if (Array.isArray(item)) {
          item.forEach(subItem => extractValues(subItem));
      } else if (typeof item === 'object' && item !== null) {
          Object.values(item).forEach(subItem => extractValues(subItem));
      } else {
          values.push(item);
      }
  }

  extractValues(obj);
  return values;
}