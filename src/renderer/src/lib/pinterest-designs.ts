import type { DesignGuide, DesignSystem } from '../App'

export interface PinterestDesignEntry {
  id: string
  name: string
  keywords: string[]
  mood: string[]
  domains: string[]
  previewUrl: string
  designSystem: DesignSystem
  guide: DesignGuide
}

export const PINTEREST_DESIGNS: PinterestDesignEntry[] = [
  {
    "id": "pin-finance-dashboard",
    "name": "Ornate Quartz",
    "keywords": [
      "finance",
      "dashboard",
      "analytics",
      "revenue",
      "charts"
    ],
    "mood": [
      "dark",
      "tech"
    ],
    "domains": [
      "finance",
      "productivity"
    ],
    "previewUrl": "https://i.pinimg.com/1200x/dc/07/27/dc0727dafb62f0e3d1699115c375e5ab.jpg",
    "designSystem": {
      "name": "Ornate Quartz",
      "colors": {
        "primary": {
          "base": "#FF7849",
          "tones": [
            "#99462c",
            "#AD5435",
            "#C2623E",
            "#D66F47",
            "#EA7D50",
            "#FF7849",
            "#FF8B63",
            "#FF9D7D",
            "#FFB097",
            "#FFC3B1",
            "#FFD5CB",
            "#FFF6F2"
          ]
        },
        "secondary": {
          "base": "#3C4142",
          "tones": [
            "#252828",
            "#2A2E2F",
            "#2F3334",
            "#343835",
            "#383D37",
            "#3C4142",
            "#4D5253",
            "#5E6364",
            "#6F7475",
            "#808586",
            "#919697",
            "#A2A7A8"
          ]
        },
        "tertiary": {
          "base": "#929BB3",
          "tones": [
            "#585E6D",
            "#616879",
            "#6B7285",
            "#747B91",
            "#7E859D",
            "#929BB3",
            "#A1AABF",
            "#B1BACB",
            "#C0CAD7",
            "#CFD9E3",
            "#DFE8EF",
            "#F0F5FB"
          ]
        },
        "neutral": {
          "base": "#FFFFFF",
          "tones": [
            "#333333",
            "#474747",
            "#5B5B5B",
            "#6F6F6F",
            "#838383",
            "#FFFFFF",
            "#F2F2F2",
            "#E6E6E6",
            "#D9D9D9",
            "#CCCCCC",
            "#BFBFBF",
            "#E0E0E0"
          ]
        }
      },
      "typography": {
        "headline": {
          "family": "Poppins",
          "size": "24px",
          "weight": "600",
          "lineHeight": "1.3"
        },
        "body": {
          "family": "Poppins",
          "size": "14px",
          "weight": "400",
          "lineHeight": "1.4"
        },
        "label": {
          "family": "Poppins",
          "size": "12px",
          "weight": "500",
          "lineHeight": "1.4"
        }
      },
      "components": {
        "buttonRadius": "8px",
        "buttonPadding": "10px 24px",
        "buttonFontWeight": "600",
        "inputRadius": "8px",
        "inputBorder": "1px solid #D9D9D9",
        "inputPadding": "10px 14px",
        "inputBg": "#FFFFFF",
        "cardRadius": "12px",
        "cardShadow": "0 2px 8px rgba(0,0,0,0.08)",
        "cardPadding": "16px",
        "chipRadius": "16px",
        "chipPadding": "4px 12px",
        "chipBg": "#F2F2F2",
        "fabSize": "56px",
        "fabRadius": "28px"
      }
    },
    "guide": {
      "overview": "Ornate Quartz evokes a sense of modern financial sophistication, utilizing a warm orange primary color balanced with cool gray neutrals for a clean and trustworthy user experience. The design system aims for a balance of approachability and professionalism.",
      "colorRules": "Primary Orange (#FF7849) is used for key actions and highlights. Secondary Gray (#3C4142) is for text and important labels. Tertiary Gray (#929BB3) is used for supporting elements and disabled states. Neutral White (#FFFFFF) is the background.",
      "typographyRules": "Use Poppins font for a modern feel. Headlines are 24px bold. Body text is 14px regular. Labels are 12px medium. Import: @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600&display=swap');",
      "elevationRules": "Subtle box shadows on cards (0 2px 8px rgba(0,0,0,0.08)). Use 1px solid borders for inputs and form elements. No blur effects.",
      "componentRules": "Buttons have rounded corners (8px). Cards have slightly rounded corners (12px). Inputs have a light gray border and white background. Navigation uses a clear, sidebar-style layout.",
      "dosAndDonts": "DO use orange for primary actions. DO keep text legible with sufficient contrast. DO keep spacing consistent throughout the design. DON'T overuse strong shadows. DON'T use too many colors. DON'T make interactive elements difficult to tap."
    }
  },
  {
    "id": "pin-dark-analytics",
    "name": "Finance Oasis",
    "keywords": [
      "analytics",
      "dark",
      "dashboard",
      "data",
      "metrics"
    ],
    "mood": [
      "dark",
      "tech"
    ],
    "domains": [
      "productivity",
      "finance"
    ],
    "previewUrl": "https://i.pinimg.com/736x/bc/1f/b2/bc1fb2ec1c1406103f71a334e04dd1af.jpg",
    "designSystem": {
      "name": "Finance Oasis",
      "colors": {
        "primary": {
          "base": "#28a745",
          "tones": [
            "#00401a",
            "#005e28",
            "#007d37",
            "#009b45",
            "#0aa754",
            "#3eb363",
            "#28a745",
            "#5cc072",
            "#80da8f",
            "#a3f2bd",
            "#c6ffe0",
            "#e9ffee"
          ]
        },
        "secondary": {
          "base": "#007bff",
          "tones": [
            "#002b80",
            "#0044a0",
            "#005dad",
            "#0077bb",
            "#0092d9",
            "#33a7e2",
            "#007bff",
            "#66c0ea",
            "#99d5f2",
            "#cceafa",
            "#e5f4ff",
            "#ffffff"
          ]
        },
        "tertiary": {
          "base": "#dc3545",
          "tones": [
            "#660d16",
            "#8a1522",
            "#aa1c2d",
            "#cb2339",
            "#ed2a45",
            "#f05b68",
            "#dc3545",
            "#f3818c",
            "#f7a8b2",
            "#fbcdd8",
            "#ffe4ee",
            "#fff0f2"
          ]
        },
        "neutral": {
          "base": "#ffffff",
          "tones": [
            "#1a1a1a",
            "#333333",
            "#4d4d4d",
            "#666666",
            "#808080",
            "#999999",
            "#ffffff",
            "#cccccc",
            "#e6e6e6",
            "#f0f0f0",
            "#f8f8f8",
            "#ffffff"
          ]
        }
      },
      "typography": {
        "headline": {
          "family": "Poppins",
          "size": "24px",
          "weight": "600",
          "lineHeight": "1.3"
        },
        "body": {
          "family": "Poppins",
          "size": "14px",
          "weight": "400",
          "lineHeight": "1.4"
        },
        "label": {
          "family": "Poppins",
          "size": "12px",
          "weight": "500",
          "lineHeight": "1.3"
        }
      },
      "components": {
        "buttonRadius": "8px",
        "buttonPadding": "10px 20px",
        "buttonFontWeight": "600",
        "inputRadius": "8px",
        "inputBorder": "1px solid #ccc",
        "inputPadding": "8px 12px",
        "inputBg": "#ffffff",
        "cardRadius": "12px",
        "cardShadow": "0 2px 8px rgba(0,0,0,0.08)",
        "cardPadding": "20px",
        "chipRadius": "9999px",
        "chipPadding": "4px 12px",
        "chipBg": "#f0f0f0",
        "fabSize": "56px",
        "fabRadius": "16px"
      }
    },
    "guide": {
      "overview": "Finance Oasis is a clean and modern design system tailored for finance applications. It focuses on creating a user-friendly experience with a calming color palette and clear, readable typography to promote trust and efficiency.",
      "colorRules": "Primary green (#28a745) is used for key actions and highlights. Secondary blue (#007bff) indicates links and interactive elements. Tertiary red (#dc3545) is used for errors or warnings. Neutral colors (white and shades of grey) create a clean and balanced layout. The base colors have corresponding tones to create visual hierarchy.",
      "typographyRules": "Poppins is used for all text elements. Headlines are 24px with 600 weight. Body text is 14px with 400 weight. Labels are 12px with 500 weight. Import via: `<link href=\"https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600&display=swap\" rel=\"stylesheet\">`",
      "elevationRules": "Cards have subtle shadows (0 2px 8px rgba(0,0,0,0.08)) to create a sense of depth. Borders are used sparingly to avoid visual clutter. Light blur effects can be used on background elements to create a layered effect.",
      "componentRules": "Buttons have rounded corners (8px) and consistent padding (10px 20px). Input fields have a light grey border and rounded corners. Cards have a generous padding and slight shadow. Chips have a pill shape. FABs are circular with rounded corners.",
      "dosAndDonts": "DO use a consistent color palette to maintain visual harmony. DO use clear and concise language to guide users effectively. DO prioritize accessibility by providing sufficient color contrast and responsive design. DON'T overcrowd the interface with excessive information. DON'T use distracting animations or transitions. DON'T neglect mobile responsiveness; ensure the design adapts to different screen sizes."
    }
  },
  {
    "id": "pin-crm-dashboard",
    "name": "Airy Mint Design",
    "keywords": [
      "crm",
      "customer",
      "sales",
      "pipeline",
      "leads"
    ],
    "mood": [
      "light",
      "tech"
    ],
    "domains": [
      "productivity"
    ],
    "previewUrl": "https://i.pinimg.com/1200x/63/17/30/6317302b76cc82a0feab8d0dfd635c8f.jpg",
    "designSystem": {
      "name": "Airy Mint Design",
      "colors": {
        "primary": {
          "base": "#66D0B0",
          "tones": [
            "#224438",
            "#2E5D4B",
            "#3A765E",
            "#468F71",
            "#52A884",
            "#5EC197",
            "#66D0B0",
            "#7AD8C0",
            "#8EDFCE",
            "#A2E7DD",
            "#B6EEEB",
            "#CAF6F9"
          ]
        },
        "secondary": {
          "base": "#FFFFFF",
          "tones": [
            "#999999",
            "#A6A6A6",
            "#B3B3B3",
            "#C0C0C0",
            "#CDCDCD",
            "#DADADA",
            "#E7E7E7",
            "#F4F4F4",
            "#FFFFFF",
            "#FFFFFF",
            "#FFFFFF",
            "#FFFFFF"
          ]
        },
        "tertiary": {
          "base": "#1B272F",
          "tones": [
            "#090D10",
            "#0C1316",
            "#0F191C",
            "#121F22",
            "#152528",
            "#182B2E",
            "#1B272F",
            "#243D45",
            "#2D535B",
            "#366971",
            "#3F7F87",
            "#48959D"
          ]
        },
        "neutral": {
          "base": "#E9F0F5",
          "tones": [
            "#707A80",
            "#7D878D",
            "#8A949A",
            "#97A1A7",
            "#A4AEB4",
            "#B1BBC1",
            "#BEC8CE",
            "#CBD5DB",
            "#D8E2E8",
            "#E5EFF5",
            "#F2FCFF",
            "#FFFFFF"
          ]
        }
      },
      "typography": {
        "headline": {
          "family": "Poppins",
          "size": "24px",
          "weight": "600",
          "lineHeight": "1.3"
        },
        "body": {
          "family": "Poppins",
          "size": "14px",
          "weight": "400",
          "lineHeight": "1.4"
        },
        "label": {
          "family": "Poppins",
          "size": "12px",
          "weight": "500",
          "lineHeight": "1.4"
        }
      },
      "components": {
        "buttonRadius": "10px",
        "buttonPadding": "8px 18px",
        "buttonFontWeight": "500",
        "inputRadius": "8px",
        "inputBorder": "1px solid #D8E2E8",
        "inputPadding": "10px 12px",
        "inputBg": "#FFFFFF",
        "cardRadius": "16px",
        "cardShadow": "0px 4px 12px rgba(0, 0, 0, 0.05)",
        "cardPadding": "20px",
        "chipRadius": "16px",
        "chipPadding": "4px 12px",
        "chipBg": "#F4F4F4",
        "fabSize": "48px",
        "fabRadius": "12px"
      }
    },
    "guide": {
      "overview": "Airy Mint Design is a fresh and clean design system that prioritizes usability and visual appeal. It incorporates soft colors and a modern typeface to create a friendly and approachable user experience.",
      "colorRules": "Primary color (#66D0B0) is used for main actions and highlights. Secondary color (#FFFFFF) is used for backgrounds and card surfaces. Tertiary color (#1B272F) is used for headings and important text. Neutral colors (#E9F0F5) are used for backgrounds and subtle UI elements.",
      "typographyRules": "@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600&display=swap'); Headline (Poppins, 24px, 600, 1.3), Body (Poppins, 14px, 400, 1.4), Label (Poppins, 12px, 500, 1.4).",
      "elevationRules": "Subtle shadows are used to create depth and layering. Borders are used sparingly, with a light color (#D8E2E8) to avoid harsh lines.",
      "componentRules": "Buttons are rounded with a consistent padding and font weight. Cards have rounded corners and a subtle shadow for depth. Inputs use a light border and padding for a clean look. Navigation elements are clear and easy to understand.",
      "dosAndDonts": "DO use consistent spacing throughout the design. DO use the primary color to highlight important actions. DO maintain a clean and minimal design. DON'T use excessive shadows. DON'T use too many colors. DON'T use fonts that are difficult to read."
    }
  },
  {
    "id": "pin-saas-admin",
    "name": "Salesforce Clarity",
    "keywords": [
      "saas",
      "admin",
      "sales",
      "panel",
      "management"
    ],
    "mood": [
      "light",
      "tech"
    ],
    "domains": [
      "productivity"
    ],
    "previewUrl": "https://i.pinimg.com/1200x/d4/24/15/d42415f774afd0f3aee0ffd2b34d38b4.jpg",
    "designSystem": {
      "name": "Salesforce Clarity",
      "colors": {
        "primary": {
          "base": "#0070d2",
          "tones": [
            "#003566",
            "#004999",
            "#0053b3",
            "#005dcd",
            "#0067e7",
            "#0070d2",
            "#3399ff",
            "#66b3ff",
            "#80c0ff",
            "#99ccff",
            "#b3d9ff",
            "#cce6ff"
          ]
        },
        "secondary": {
          "base": "#f9f9f9",
          "tones": [
            "#e6e6e6",
            "#e8e8e8",
            "#ebebeb",
            "#ececec",
            "#f0f0f0",
            "#f2f2f2",
            "#f4f4f4",
            "#f6f6f6",
            "#f7f7f7",
            "#f8f8f8",
            "#f9f9f9",
            "#fafafa"
          ]
        },
        "tertiary": {
          "base": "#ffb75d",
          "tones": [
            "#73481c",
            "#8c5722",
            "#a66628",
            "#bf752e",
            "#d98534",
            "#ffb75d",
            "#ffca85",
            "#ffdeac",
            "#fff1d3",
            "#fff4da",
            "#fff7e0",
            "#fffbf3"
          ]
        },
        "neutral": {
          "base": "#444444",
          "tones": [
            "#1a1a1a",
            "#222222",
            "#2b2b2b",
            "#333333",
            "#3b3b3b",
            "#444444",
            "#666666",
            "#888888",
            "#aaaaaa",
            "#cccccc",
            "#e5e5e5",
            "#f2f2f2"
          ]
        }
      },
      "typography": {
        "headline": {
          "family": "Roboto",
          "size": "24px",
          "weight": "700",
          "lineHeight": "1.3"
        },
        "body": {
          "family": "Roboto",
          "size": "14px",
          "weight": "400",
          "lineHeight": "1.5"
        },
        "label": {
          "family": "Roboto",
          "size": "12px",
          "weight": "500",
          "lineHeight": "1.4"
        }
      },
      "components": {
        "buttonRadius": "6px",
        "buttonPadding": "8px 16px",
        "buttonFontWeight": "600",
        "inputRadius": "6px",
        "inputBorder": "1px solid #ccc",
        "inputPadding": "8px 12px",
        "inputBg": "#ffffff",
        "cardRadius": "8px",
        "cardShadow": "0 1px 4px rgba(0,0,0,0.1)",
        "cardPadding": "16px",
        "chipRadius": "16px",
        "chipPadding": "4px 10px",
        "chipBg": "#f0f0f0",
        "fabSize": "48px",
        "fabRadius": "12px"
      }
    },
    "guide": {
      "overview": "Salesforce Clarity is a clean and efficient design system focused on clarity and usability. It prioritizes a consistent user experience with clear typography, simple shapes, and a muted color palette, promoting productivity and easy navigation within the platform.",
      "colorRules": "Primary color (#0070d2) is used for key interactive elements and branding. Secondary color (#f9f9f9) provides neutral backgrounds and emphasizes content areas. Tertiary color (#ffb75d) sparingly highlight important actions. Neutral colors (#444444) provide contrast for text readability.",
      "typographyRules": "Use Roboto for all text. Headlines are 24px bold, body text is 14px regular, and labels are 12px medium. Line height should be 1.3 for headlines and 1.5 for body text. Import: @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap');",
      "elevationRules": "Subtle shadows are used for cards to create depth and hierarchy. Use a 1px solid border for input fields to distinguish them from the background. Blurs are not used.",
      "componentRules": "Buttons have rounded corners and sufficient padding for clickability. Cards should contain related information. Input fields should have a clear border and sufficient padding. Chips provide visual cues for filter and selection states.",
      "dosAndDonts": "DO use color sparingly to highlight key information. DO maintain consistent padding and spacing across components. DO use clear and concise language in labels and descriptions. DON'T use excessive shadows or gradients that distract from the content. DON'T use more than three font sizes on a single page. DON'T overcrowd cards with too much information."
    }
  },
  {
    "id": "pin-ecommerce-dash",
    "name": "Skyline Serenity UI",
    "keywords": [
      "ecommerce",
      "shop",
      "orders",
      "products",
      "store"
    ],
    "mood": [
      "light",
      "playful"
    ],
    "domains": [
      "ecommerce"
    ],
    "previewUrl": "https://i.pinimg.com/736x/d8/76/3a/d8763a5ef2d8dab47bd5555fa5977579.jpg",
    "designSystem": {
      "name": "Skyline Serenity UI",
      "colors": {
        "primary": {
          "base": "#5D87FF",
          "tones": [
            "#1E327F",
            "#2E4899",
            "#3D5EBF",
            "#4D74DF",
            "#5D87FF",
            "#739BFF",
            "#89ADFF",
            "#9FC1FF",
            "#B5D5FF",
            "#CCE9FF",
            "#E2FDFF",
            "#F8FFFF"
          ]
        },
        "secondary": {
          "base": "#E0E5EC",
          "tones": [
            "#646A73",
            "#7A808A",
            "#9096A0",
            "#A6ACB6",
            "#BCC2CC",
            "#D2D8E2",
            "#E0E5EC",
            "#E8EDF3",
            "#F0F5FA",
            "#F8FCFF",
            "#FFFFFF",
            "#FFFFFF"
          ]
        },
        "tertiary": {
          "base": "#F0726C",
          "tones": [
            "#69211D",
            "#862B27",
            "#A33631",
            "#C0403B",
            "#DD4A45",
            "#F05D57",
            "#F0726C",
            "#F28781",
            "#F49C96",
            "#F6B1AB",
            "#F8C6C0",
            "#FAEBD5"
          ]
        },
        "neutral": {
          "base": "#1A202C",
          "tones": [
            "#05070B",
            "#0A0F16",
            "#0F1421",
            "#141A2C",
            "#1A202C",
            "#262D3D",
            "#323A4E",
            "#3E475F",
            "#4A5470",
            "#566181",
            "#626E92",
            "#6E7BA3"
          ]
        }
      },
      "typography": {
        "headline": {
          "family": "Poppins",
          "size": "24px",
          "weight": "600",
          "lineHeight": "1.3"
        },
        "body": {
          "family": "Poppins",
          "size": "14px",
          "weight": "400",
          "lineHeight": "1.5"
        },
        "label": {
          "family": "Poppins",
          "size": "12px",
          "weight": "500",
          "lineHeight": "1.4"
        }
      },
      "components": {
        "buttonRadius": "8px",
        "buttonPadding": "8px 16px",
        "buttonFontWeight": "500",
        "inputRadius": "8px",
        "inputBorder": "1px solid #CED4DA",
        "inputPadding": "10px 14px",
        "inputBg": "#FFFFFF",
        "cardRadius": "16px",
        "cardShadow": "0 4px 12px rgba(0, 0, 0, 0.05)",
        "cardPadding": "20px",
        "chipRadius": "16px",
        "chipPadding": "4px 12px",
        "chipBg": "#E9ECEF",
        "fabSize": "48px",
        "fabRadius": "12px"
      }
    },
    "guide": {
      "overview": "Skyline Serenity UI aims to provide a clean, modern, and intuitive user experience. It leverages a calming color palette and clear typography to promote focus and efficiency in task management and project tracking.",
      "colorRules": "Primary color #5D87FF is used for key interactive elements. Secondary color #E0E5EC provides a neutral background and dividers. Tertiary color #F0726C is reserved for alerts and important indicators. Neutral colors ranging from #1A202C to #6E7BA3 are used for text and iconography, with varying shades for hierarchy.",
      "typographyRules": "Poppins is the primary font, utilized in different weights and sizes to establish visual hierarchy. Use 24px bold for headlines, 14px regular for body text, and 12px medium for labels. @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600&display=swap');",
      "elevationRules": "Subtle shadows are employed to create depth and separation between elements. Cards use a 0 4px 12px shadow, while buttons and other interactive elements use lighter shadows. Borders are generally 1px solid and use the lighter tones of the secondary color.",
      "componentRules": "Buttons have rounded corners (8px) and sufficient padding to improve touch target usability. Cards feature rounded corners (16px) and a slight shadow to create a layered effect. Input fields are straightforward with a light border and rounded corners. Chips are rounded and use a light background color.",
      "dosAndDonts": "DO: Use consistent spacing and padding throughout the design. DO: Maintain a clear visual hierarchy using typography and color. DO: Ensure interactive elements are easily identifiable and accessible. DON'T: Overuse bright colors, which can distract the user. DON'T: Use too many different font sizes and weights. DON'T: Create dense, cluttered layouts."
    }
  },
  {
    "id": "pin-health-dashboard",
    "name": "Zenith Healthscape",
    "keywords": [
      "health",
      "medical",
      "patient",
      "hospital",
      "doctor"
    ],
    "mood": [
      "light",
      "tech"
    ],
    "domains": [
      "fitness"
    ],
    "previewUrl": "https://i.pinimg.com/1200x/e8/2a/c8/e82ac871780c3729e9053040056b3853.jpg",
    "designSystem": {
      "name": "Zenith Healthscape",
      "colors": {
        "primary": {
          "base": "#4169e1",
          "tones": [
            "#1a285a",
            "#213579",
            "#284297",
            "#2f4fb6",
            "#365cc4",
            "#3d69e3",
            "#4169e1",
            "#5b82ea",
            "#759bf3",
            "#8fb4fc",
            "#a9cdff",
            "#c3e6ff"
          ]
        },
        "secondary": {
          "base": "#ffffff",
          "tones": [
            "#b3b3b3",
            "#bdbdbd",
            "#c7c7c7",
            "#d1d1d1",
            "#dbdbdb",
            "#e5e5e5",
            "#ffffff",
            "#f2f2f2",
            "#fafafa",
            "#ffffff",
            "#ffffff",
            "#ffffff"
          ]
        },
        "tertiary": {
          "base": "#000000",
          "tones": [
            "#000000",
            "#0a0a0a",
            "#141414",
            "#1e1e1e",
            "#282828",
            "#323232",
            "#000000",
            "#464646",
            "#505050",
            "#5a5a5a",
            "#646464",
            "#6e6e6e"
          ]
        },
        "neutral": {
          "base": "#f5f5f5",
          "tones": [
            "#cccccc",
            "#d0d0d0",
            "#d4d4d4",
            "#d8d8d8",
            "#dcdcdc",
            "#e0e0e0",
            "#f5f5f5",
            "#eaeaea",
            "#eeeeee",
            "#f2f2f2",
            "#f7f7f7",
            "#ffffff"
          ]
        }
      },
      "typography": {
        "headline": {
          "family": "Poppins",
          "size": "24px",
          "weight": "600",
          "lineHeight": "1.3"
        },
        "body": {
          "family": "Poppins",
          "size": "14px",
          "weight": "400",
          "lineHeight": "1.5"
        },
        "label": {
          "family": "Poppins",
          "size": "12px",
          "weight": "500",
          "lineHeight": "1.4"
        }
      },
      "components": {
        "buttonRadius": "8px",
        "buttonPadding": "10px 20px",
        "buttonFontWeight": "500",
        "inputRadius": "8px",
        "inputBorder": "1px solid #ccc",
        "inputPadding": "10px 14px",
        "inputBg": "#ffffff",
        "cardRadius": "12px",
        "cardShadow": "0 2px 8px rgba(0,0,0,0.08)",
        "cardPadding": "20px",
        "chipRadius": "9999px",
        "chipPadding": "4px 12px",
        "chipBg": "#f0f0f0",
        "fabSize": "56px",
        "fabRadius": "16px"
      }
    },
    "guide": {
      "overview": "Zenith Healthscape offers a calm and trustworthy interface for managing health information. The design focuses on clarity and simplicity, using a cool primary color and clean typography to promote a sense of wellbeing.",
      "colorRules": "The primary color (#4169e1) is used for key actions and highlights. White (#ffffff) is used for backgrounds to create space, and black (#000000) for text to improve readability. Neutral grays (#f5f5f5) are used for subtle backgrounds and dividers.",
      "typographyRules": "@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600&display=swap');\nHeadlines: Poppins, 24px, Semibold, 1.3 line-height.\nBody: Poppins, 14px, Regular, 1.5 line-height.\nLabels: Poppins, 12px, Medium, 1.4 line-height.",
      "elevationRules": "Subtle shadows (0 2px 8px rgba(0,0,0,0.08)) are used on cards to create a sense of depth. Borders are light gray and 1px thick for visual clarity.",
      "componentRules": "Buttons are rounded with 8px radius and use the primary color. Input fields have a white background and a light gray border. Cards have rounded corners and a subtle shadow to elevate them from the background.",
      "dosAndDonts": "DO: Use consistent spacing and alignment. DO: Keep text concise and easy to understand. DO: Use color to draw attention to important elements.\nDON'T: Use excessive shadows or gradients. DON'T: Use too many fonts or font weights. DON'T: Overcrowd the interface with too much information."
    }
  },
  {
    "id": "pin-project-mgmt",
    "name": "Health Clarity",
    "keywords": [
      "project",
      "task",
      "kanban",
      "team",
      "management"
    ],
    "mood": [
      "light",
      "tech"
    ],
    "domains": [
      "productivity"
    ],
    "previewUrl": "https://i.pinimg.com/1200x/39/99/37/399937ad556cfc9bc02f4e3c269affd7.jpg",
    "designSystem": {
      "name": "Health Clarity",
      "colors": {
        "primary": {
          "base": "#F2C94C",
          "tones": [
            "#B28F35",
            "#C19E3C",
            "#D0AD43",
            "#DFBC4A",
            "#EECB51",
            "#F0D458",
            "#F2C94C",
            "#F3D263",
            "#F5DB7A",
            "#F7E491",
            "#F9EDB8",
            "#FEF9E6"
          ]
        },
        "secondary": {
          "base": "#613159",
          "tones": [
            "#43223F",
            "#4D2848",
            "#572D52",
            "#61335B",
            "#6B3864",
            "#753E6D",
            "#613159",
            "#894980",
            "#934F89",
            "#9D5592",
            "#A75AA3",
            "#B160AC"
          ]
        },
        "tertiary": {
          "base": "#EB5757",
          "tones": [
            "#A43B3B",
            "#B24242",
            "#C04848",
            "#CE4F4F",
            "#DC5555",
            "#EA5C5C",
            "#EB5757",
            "#EF6E6E",
            "#F28585",
            "#F59C9C",
            "#F8B3B3",
            "#FBDADA"
          ]
        },
        "neutral": {
          "base": "#FFFFFF",
          "tones": [
            "#1A1A1A",
            "#333333",
            "#4D4D4D",
            "#666666",
            "#808080",
            "#999999",
            "#FFFFFF",
            "#D9D9D9",
            "#E6E6E6",
            "#F2F2F2",
            "#FAFAFA",
            "#FFFFFF"
          ]
        }
      },
      "typography": {
        "headline": {
          "family": "Inter",
          "size": "24px",
          "weight": "700",
          "lineHeight": "1.3"
        },
        "body": {
          "family": "Inter",
          "size": "14px",
          "weight": "400",
          "lineHeight": "1.5"
        },
        "label": {
          "family": "Inter",
          "size": "10px",
          "weight": "500",
          "lineHeight": "1.4"
        }
      },
      "components": {
        "buttonRadius": "8px",
        "buttonPadding": "10px 20px",
        "buttonFontWeight": "600",
        "inputRadius": "8px",
        "inputBorder": "1px solid #ccc",
        "inputPadding": "10px 14px",
        "inputBg": "#ffffff",
        "cardRadius": "12px",
        "cardShadow": "0 2px 8px rgba(0,0,0,0.08)",
        "cardPadding": "20px",
        "chipRadius": "9999px",
        "chipPadding": "4px 12px",
        "chipBg": "#f0f0f0",
        "fabSize": "56px",
        "fabRadius": "16px"
      }
    },
    "guide": {
      "overview": "A clean and accessible UI theme for health-related dashboards, emphasizing clarity and trust. It uses a combination of warm and calm colors for a professional look.",
      "colorRules": "Primary color #F2C94C for key actions and highlights. Secondary color #613159 used sparingly for accents and navigation. Neutral color #FFFFFF as background. Tertiary color #EB5757 for alerts.",
      "typographyRules": "@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap'); Headlines are Inter 24px bold, body text is Inter 14px regular, and labels are Inter 10px medium.",
      "elevationRules": "Subtle shadows are used for cards and buttons to create depth. Borders are kept light gray (#ccc) and minimal for a clean look.",
      "componentRules": "Buttons have rounded corners and a slight shadow. Cards use a consistent border radius and shadow. Input fields are clean and minimal with a light gray border.",
      "dosAndDonts": "DO: Use primary color to highlight important information. DO: Maintain consistent spacing and alignment. DO: Ensure text is easily readable. DON'T: Overuse the secondary color. DON'T: Use excessive shadows. DON'T: Use more than 3 different font sizes."
    }
  },
  {
    "id": "pin-social-analytics",
    "name": "Aqua Data",
    "keywords": [
      "social",
      "analytics",
      "engagement",
      "followers",
      "posts"
    ],
    "mood": [
      "light",
      "playful"
    ],
    "domains": [
      "social",
      "productivity"
    ],
    "previewUrl": "https://i.pinimg.com/1200x/60/92/4b/60924bbda9fb7f9e96e2d35fb5efd80b.jpg",
    "designSystem": {
      "name": "Aqua Data",
      "colors": {
        "primary": {
          "base": "#4FC3F7",
          "tones": [
            "#2980B9",
            "#3498DB",
            "#5DADE2",
            "#85C1E9",
            "#A7D5F2",
            "#BDE2F8",
            "#4FC3F7",
            "#79DAFF",
            "#A2E2FF",
            "#CAEBFF",
            "#E2F3FF",
            "#F0FAFF"
          ]
        },
        "secondary": {
          "base": "#66BB6A",
          "tones": [
            "#33691E",
            "#4CAF50",
            "#5E35B1",
            "#7CB342",
            "#9CCC65",
            "#AED581",
            "#66BB6A",
            "#81C784",
            "#A5D6A7",
            "#C8E6C9",
            "#E8F5E9",
            "#F1F8E9"
          ]
        },
        "tertiary": {
          "base": "#FF7043",
          "tones": [
            "#B71C1C",
            "#D32F2F",
            "#F44336",
            "#E57373",
            "#EF9A9A",
            "#FFCDD2",
            "#FF7043",
            "#FF8A65",
            "#FFAB91",
            "#FFCCBC",
            "#FFE0B2",
            "#FFF3E0"
          ]
        },
        "neutral": {
          "base": "#FFFFFF",
          "tones": [
            "#212121",
            "#424242",
            "#616161",
            "#757575",
            "#9E9E9E",
            "#BDBDBD",
            "#FFFFFF",
            "#EEEEEE",
            "#F5F5F5",
            "#FAFAFA",
            "#FCFCFC",
            "#FFFFFF"
          ]
        }
      },
      "typography": {
        "headline": {
          "family": "Open Sans",
          "size": "32px",
          "weight": "700",
          "lineHeight": "1.2"
        },
        "body": {
          "family": "Open Sans",
          "size": "16px",
          "weight": "400",
          "lineHeight": "1.5"
        },
        "label": {
          "family": "Open Sans",
          "size": "12px",
          "weight": "500",
          "lineHeight": "1.4"
        }
      },
      "components": {
        "buttonRadius": "4px",
        "buttonPadding": "8px 16px",
        "buttonFontWeight": "600",
        "inputRadius": "4px",
        "inputBorder": "1px solid #E0E0E0",
        "inputPadding": "8px 12px",
        "inputBg": "#FFFFFF",
        "cardRadius": "8px",
        "cardShadow": "0 1px 3px rgba(0,0,0,0.05)",
        "cardPadding": "16px",
        "chipRadius": "16px",
        "chipPadding": "4px 12px",
        "chipBg": "#E0F7FA",
        "fabSize": "56px",
        "fabRadius": "28px"
      }
    },
    "guide": {
      "overview": "A clean and modern design system focusing on data visualization and clarity. Aqua Data uses a bright primary color palette combined with simple typography to provide a user-friendly experience.",
      "colorRules": "Primary color (#4FC3F7) is used for main interactive elements. Secondary color (#66BB6A) indicates positive trends. Tertiary color (#FF7043) suggests warnings or alerts. Neutral colors (#FFFFFF, #EEEEEE, etc.) are for backgrounds and text.",
      "typographyRules": "Open Sans is used for all text elements. Headline sizes range from 24px to 32px with a weight of 700. Body text is typically 14px to 16px with a weight of 400. Labels are consistently 12px with a weight of 500. @import url('https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;500;700&display=swap');",
      "elevationRules": "Subtle shadows are used to create depth, primarily on cards. Border thickness is typically 1px for input fields.",
      "componentRules": "Buttons have a slightly rounded corner and use the primary color for interaction. Cards use subtle shadows and padding to highlight content. Input fields are basic with a light grey border. Chips have a pill-like appearance with a light background.",
      "dosAndDonts": "DO use the primary color for interactive elements. DO maintain consistent spacing throughout the interface. DO use subtle shadows for depth. DON'T overuse the tertiary color; use it sparingly. DON'T use more than two font weights within a single view. DON'T use excessively rounded corners."
    }
  },
  {
    "id": "pin-music-player",
    "name": "Serene Vista",
    "keywords": [
      "music",
      "player",
      "audio",
      "streaming",
      "playlist"
    ],
    "mood": [
      "dark",
      "elegant"
    ],
    "domains": [
      "music"
    ],
    "previewUrl": "https://i.pinimg.com/1200x/3a/47/16/3a4716bce19ab3708d7b612d2301f304.jpg",
    "designSystem": {
      "name": "Serene Vista",
      "colors": {
        "primary": {
          "base": "#007bff",
          "tones": [
            "#003680",
            "#004499",
            "#0053b3",
            "#0061cc",
            "#007bff",
            "#3399ff",
            "#66b3ff",
            "#99ccff",
            "#cce6ff",
            "#e6f2ff",
            "#f2f8ff",
            "#ffffff"
          ]
        },
        "secondary": {
          "base": "#28a745",
          "tones": [
            "#0f441a",
            "#155c24",
            "#1b742e",
            "#218c38",
            "#28a745",
            "#50b868",
            "#78c98a",
            "#a0dacd",
            "#c8ebe0",
            "#f0fbf3",
            "#f8fdf7",
            "#ffffff"
          ]
        },
        "tertiary": {
          "base": "#dc3545",
          "tones": [
            "#68141b",
            "#801b23",
            "#99222b",
            "#b32933",
            "#dc3545",
            "#e86470",
            "#f3939b",
            "#fec2c6",
            "#ffdfe1",
            "#ffeef0",
            "#fff4f5",
            "#ffffff"
          ]
        },
        "neutral": {
          "base": "#ffffff",
          "tones": [
            "#1a1a1a",
            "#333333",
            "#4d4d4d",
            "#666666",
            "#808080",
            "#999999",
            "#b3b3b3",
            "#cccccc",
            "#e6e6e6",
            "#f2f2f2",
            "#f9f9f9",
            "#ffffff"
          ]
        }
      },
      "typography": {
        "headline": {
          "family": "Roboto, sans-serif",
          "size": "32px",
          "weight": "700",
          "lineHeight": "1.2"
        },
        "body": {
          "family": "Roboto, sans-serif",
          "size": "16px",
          "weight": "400",
          "lineHeight": "1.5"
        },
        "label": {
          "family": "Roboto, sans-serif",
          "size": "12px",
          "weight": "500",
          "lineHeight": "1.4"
        }
      },
      "components": {
        "buttonRadius": "8px",
        "buttonPadding": "10px 20px",
        "buttonFontWeight": "600",
        "inputRadius": "8px",
        "inputBorder": "1px solid #ccc",
        "inputPadding": "10px 14px",
        "inputBg": "#ffffff",
        "cardRadius": "12px",
        "cardShadow": "0 2px 8px rgba(0,0,0,0.08)",
        "cardPadding": "20px",
        "chipRadius": "9999px",
        "chipPadding": "4px 12px",
        "chipBg": "#f0f0f0",
        "fabSize": "56px",
        "fabRadius": "16px"
      }
    },
    "guide": {
      "overview": "Serene Vista presents a calming and informative user interface. It uses a blue primary color scheme with a touch of green and red for highlights, emphasizing key data with a clean and modern design.",
      "colorRules": "Use primary color (#007bff) for main actions and highlights. Secondary color (#28a745) indicates success or positive trends. Tertiary color (#dc3545) signals warnings or negative trends. Neutral color (#ffffff) creates a clean background and balanced contrast.",
      "typographyRules": "@import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap'); Headline (32px, 700 weight, 1.2 line-height). Body (16px, 400 weight, 1.5 line-height). Label (12px, 500 weight, 1.4 line-height).",
      "elevationRules": "Use subtle shadows for card elevation (0 2px 8px rgba(0,0,0,0.08)). Borders are typically 1px solid #ccc for input fields. Avoid excessive use of blur effects to maintain clarity.",
      "componentRules": "Buttons have rounded corners (8px) with moderate padding. Cards use rounded corners (12px) and gentle shadows. Input fields have a white background (#ffffff) and a light gray border.",
      "dosAndDonts": "DO use primary color for actionable elements. DO maintain a clean and consistent layout. DO use secondary and tertiary colors sparingly for emphasis. DON'T use excessive shadows or gradients. DON'T use overly bright or saturated colors. DON'T use more than three font weights."
    }
  },
  {
    "id": "pin-banking-app",
    "name": "Sunrise Coral",
    "keywords": [
      "banking",
      "wallet",
      "payment",
      "transfer",
      "money"
    ],
    "mood": [
      "light",
      "elegant"
    ],
    "domains": [
      "finance"
    ],
    "previewUrl": "https://i.pinimg.com/1200x/17/0a/8f/170a8f848a0f340a5fdf4c19f37bbd4e.jpg",
    "designSystem": {
      "name": "Sunrise Coral",
      "colors": {
        "primary": {
          "base": "#E5593A",
          "tones": [
            "#8F2818",
            "#A3321E",
            "#B73C25",
            "#CC472B",
            "#E05132",
            "#F45B38",
            "#E5593A",
            "#EA6B4D",
            "#EF7E60",
            "#F39173",
            "#F8A486",
            "#FDD799"
          ]
        },
        "secondary": {
          "base": "#7EC8E3",
          "tones": [
            "#45798D",
            "#538EA2",
            "#61A3B8",
            "#6FB8CD",
            "#7DBDDD",
            "#8BC3D3",
            "#7EC8E3",
            "#8ED1E8",
            "#9ED8ED",
            "#AEE1F2",
            "#BEE9F7",
            "#CFFAF7"
          ]
        },
        "tertiary": {
          "base": "#616161",
          "tones": [
            "#272727",
            "#333333",
            "#3F3F3F",
            "#4B4B4B",
            "#575757",
            "#636363",
            "#616161",
            "#737373",
            "#858585",
            "#979797",
            "#A9A9A9",
            "#BBBBBB"
          ]
        },
        "neutral": {
          "base": "#FFFFFF",
          "tones": [
            "#4A4A4A",
            "#666666",
            "#828282",
            "#9E9E9E",
            "#BABABA",
            "#D6D6D6",
            "#E6E6E6",
            "#F2F2F2",
            "#F5F5F5",
            "#FAFAFA",
            "#FCFCFC",
            "#FFFFFF"
          ]
        }
      },
      "typography": {
        "headline": {
          "family": "Poppins",
          "size": "24px",
          "weight": "700",
          "lineHeight": "1.3"
        },
        "body": {
          "family": "Poppins",
          "size": "14px",
          "weight": "400",
          "lineHeight": "1.5"
        },
        "label": {
          "family": "Poppins",
          "size": "12px",
          "weight": "500",
          "lineHeight": "1.4"
        }
      },
      "components": {
        "buttonRadius": "8px",
        "buttonPadding": "12px 24px",
        "buttonFontWeight": "600",
        "inputRadius": "8px",
        "inputBorder": "1px solid #D6D6D6",
        "inputPadding": "10px 14px",
        "inputBg": "#ffffff",
        "cardRadius": "12px",
        "cardShadow": "0 2px 8px rgba(0,0,0,0.08)",
        "cardPadding": "20px",
        "chipRadius": "9999px",
        "chipPadding": "4px 12px",
        "chipBg": "#F2F2F2",
        "fabSize": "56px",
        "fabRadius": "16px"
      }
    },
    "guide": {
      "overview": "The Sunrise Coral theme combines warm, inviting colors with a clean and modern design. It aims to provide a user-friendly experience that is both visually appealing and functionally efficient, creating a sense of warmth and trust.",
      "colorRules": "Use #E5593A for primary actions and accents. Utilize the neutral tones (#FFFFFF and shades of grey) for backgrounds and text to ensure readability. Secondary color (#7EC8E3) can be used for interactive elements and subtle highlights. Avoid using more than three primary colors in the same screen to maintain visual harmony.",
      "typographyRules": "@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;700&display=swap'); Headline (Poppins, 24px, 700, 1.3) for titles and important headings. Body (Poppins, 14px, 400, 1.5) for general text and descriptions. Label (Poppins, 12px, 500, 1.4) for form labels and smaller text elements.",
      "elevationRules": "Use card shadows (0 2px 8px rgba(0,0,0,0.08)) for containers to create depth and separation between elements. Use subtle borders (1px solid #D6D6D6) for inputs and other interactive components to enhance their visibility. Avoid overusing shadows to prevent the UI from looking cluttered.",
      "componentRules": "Buttons should have rounded corners (8px) and sufficient padding (12px 24px). Inputs should have a light grey border (#D6D6D6) and rounded corners (8px). Cards should have a rounded corners and shadows. Chips should be small and unobtrusive.",
      "dosAndDonts": "Use a consistent color palette throughout the design. Maintain ample whitespace to improve readability and visual hierarchy. Use clear and concise language in all UI elements. Use too many colors or fonts, as this can make the UI look cluttered and unprofessional. Use excessively bright or distracting colors. Neglect accessibility considerations such as sufficient color contrast."
    }
  },
  {
    "id": "pin-travel-booking",
    "name": "Zenith Healthcare",
    "keywords": [
      "travel",
      "booking",
      "hotel",
      "flight",
      "vacation"
    ],
    "mood": [
      "light",
      "elegant"
    ],
    "domains": [
      "travel"
    ],
    "previewUrl": "https://i.pinimg.com/1200x/a8/70/2c/a8702ce0af0f6ab15be6ae765ff57ce6.jpg",
    "designSystem": {
      "name": "Zenith Healthcare",
      "colors": {
        "primary": {
          "base": "#66B5FF",
          "tones": [
            "#2E64A0",
            "#3A77BB",
            "#468AC6",
            "#529DDA",
            "#5EB0EB",
            "#6ABDF7",
            "#66B5FF",
            "#72C2FF",
            "#7EC9FF",
            "#8AD6FF",
            "#96E3FF",
            "#A2F0FF"
          ]
        },
        "secondary": {
          "base": "#8053FF",
          "tones": [
            "#3E278C",
            "#4E349B",
            "#5E41AA",
            "#6E4EBA",
            "#7E5BCA",
            "#8E68DA",
            "#8053FF",
            "#9E75FF",
            "#AE82FF",
            "#BE8FFF",
            "#CE9CFF",
            "#DDA9FF"
          ]
        },
        "tertiary": {
          "base": "#FF5D9E",
          "tones": [
            "#A8275B",
            "#B8346A",
            "#C84179",
            "#D84E88",
            "#E85B97",
            "#F868A6",
            "#FF5D9E",
            "#FF73B1",
            "#FF89C4",
            "#FF9FD7",
            "#FFB5EA",
            "#FFCBFD"
          ]
        },
        "neutral": {
          "base": "#F5F7FA",
          "tones": [
            "#333333",
            "#444444",
            "#555555",
            "#666666",
            "#777777",
            "#888888",
            "#F5F7FA",
            "#999999",
            "#AAAAAA",
            "#BBBBBB",
            "#CCCCCC",
            "#EEEEEE"
          ]
        }
      },
      "typography": {
        "headline": {
          "family": "Poppins",
          "size": "24px",
          "weight": "600",
          "lineHeight": "1.3"
        },
        "body": {
          "family": "Poppins",
          "size": "14px",
          "weight": "400",
          "lineHeight": "1.5"
        },
        "label": {
          "family": "Poppins",
          "size": "12px",
          "weight": "500",
          "lineHeight": "1.4"
        }
      },
      "components": {
        "buttonRadius": "8px",
        "buttonPadding": "12px 24px",
        "buttonFontWeight": "500",
        "inputRadius": "8px",
        "inputBorder": "1px solid #E0E0E0",
        "inputPadding": "10px 16px",
        "inputBg": "#FFFFFF",
        "cardRadius": "12px",
        "cardShadow": "0 2px 10px rgba(0, 0, 0, 0.06)",
        "cardPadding": "16px",
        "chipRadius": "16px",
        "chipPadding": "6px 12px",
        "chipBg": "#E8F5E9",
        "fabSize": "48px",
        "fabRadius": "12px"
      }
    },
    "guide": {
      "overview": "Zenith Healthcare presents a modern and approachable interface for healthcare management. It prioritizes clear data presentation, intuitive navigation, and a calming color palette to create a user-friendly experience.",
      "colorRules": "Use primary (#66B5FF) for main interactive elements and accents. Secondary (#8053FF) can be used for less prominent actions and visual variety. Tertiary (#FF5D9E) is for alerts, attention, or key performance indicator call outs. Neutral (#F5F7FA) should be the background for containers and cards.",
      "typographyRules": "@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600&display=swap'); Headline: 24px Poppins, 600 weight, 1.3 line-height; Body: 14px Poppins, 400 weight, 1.5 line-height; Label: 12px Poppins, 500 weight, 1.4 line-height.",
      "elevationRules": "Use subtle shadows (0 2px 10px rgba(0, 0, 0, 0.06)) on cards and containers to create depth. Employ borders sparingly, primarily on input fields, with a light gray color (#E0E0E0).",
      "componentRules": "Buttons should use the primary color for the background, white for text, and a slightly darker shade on hover. Cards should have rounded corners and a subtle shadow. Inputs should have a light border and adequate padding for easy readability.",
      "dosAndDonts": "DO: Maintain a consistent color palette throughout the interface. DO: Use ample whitespace to improve readability. DO: Ensure interactive elements are clearly identifiable. DON'T: Overuse shadows or gradients. DON'T: Use overly bright or distracting colors. DON'T: Crowd the interface with too much information."
    }
  },
  {
    "id": "pin-fitness-tracker",
    "name": "Pitch Deck Pro",
    "keywords": [
      "fitness",
      "workout",
      "gym",
      "exercise",
      "tracking"
    ],
    "mood": [
      "dark",
      "tech"
    ],
    "domains": [
      "fitness"
    ],
    "previewUrl": "https://i.pinimg.com/1200x/24/93/a9/2493a92019be57c09f6cdfb0c506497c.jpg",
    "designSystem": {
      "name": "Pitch Deck Pro",
      "colors": {
        "primary": {
          "base": "#7976F5",
          "tones": [
            "#343363",
            "#42408A",
            "#504EAF",
            "#5E5BC6",
            "#6C68E0",
            "#7A76F8",
            "#8884FF",
            "#9692FF",
            "#A4A0FF",
            "#B2AEFF",
            "#C0BCFF",
            "#CECAFF"
          ]
        },
        "secondary": {
          "base": "#F2D167",
          "tones": [
            "#715E28",
            "#8E7435",
            "#AC8A42",
            "#C9A14F",
            "#E6B75C",
            "#F4C369",
            "#F8CD76",
            "#FBE583",
            "#FDF290",
            "#FEFACD",
            "#FFF7DA",
            "#FFF3E7"
          ]
        },
        "tertiary": {
          "base": "#E9657A",
          "tones": [
            "#662731",
            "#853341",
            "#A43F51",
            "#C34B61",
            "#E25771",
            "#EF637E",
            "#F3708B",
            "#F77C98",
            "#FB88A5",
            "#FF94B2",
            "#FFA0BF",
            "#FFACCB"
          ]
        },
        "neutral": {
          "base": "#FFFFFF",
          "tones": [
            "#1A1A1A",
            "#333333",
            "#4D4D4D",
            "#666666",
            "#808080",
            "#999999",
            "#B3B3B3",
            "#CCCCCC",
            "#E6E6E6",
            "#F0F0F0",
            "#F7F7F7",
            "#FFFFFF"
          ]
        }
      },
      "typography": {
        "headline": {
          "family": "Poppins",
          "size": "24px",
          "weight": "600",
          "lineHeight": "1.3"
        },
        "body": {
          "family": "Poppins",
          "size": "14px",
          "weight": "400",
          "lineHeight": "1.4"
        },
        "label": {
          "family": "Poppins",
          "size": "12px",
          "weight": "500",
          "lineHeight": "1.2"
        }
      },
      "components": {
        "buttonRadius": "8px",
        "buttonPadding": "10px 20px",
        "buttonFontWeight": "500",
        "inputRadius": "8px",
        "inputBorder": "1px solid #DEDEDE",
        "inputPadding": "10px 14px",
        "inputBg": "#FFFFFF",
        "cardRadius": "12px",
        "cardShadow": "0px 4px 8px rgba(0, 0, 0, 0.05)",
        "cardPadding": "16px",
        "chipRadius": "16px",
        "chipPadding": "4px 12px",
        "chipBg": "#F2F4F7",
        "fabSize": "48px",
        "fabRadius": "50%"
      }
    },
    "guide": {
      "overview": "A design system tailored for Pitch Deck Pro, focusing on a clean and modern aesthetic to showcase presentations effectively. The system utilizes a vibrant primary color paired with neutral backgrounds for maximum content clarity.",
      "colorRules": "Primary color #7976F5 should be used for main actions and highlights. Secondary color #F2D167 is for accents and calls to attention. Neutral colors range from #FFFFFF to #1A1A1A for backgrounds, text, and dividers.",
      "typographyRules": "Poppins font family is used throughout. Headline size: 24px, Body size: 14px, Label size: 12px. Import Poppins from Google Fonts: @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600&display=swap');",
      "elevationRules": "Shadows are subtle, used to lift elements slightly. Card shadows use rgba(0, 0, 0, 0.05). Borders are light gray #DEDEDE.",
      "componentRules": "Buttons are rounded with consistent padding. Cards have rounded corners and subtle shadows. Inputs use a light border and white background.",
      "dosAndDonts": "DO use the primary color sparingly for emphasis. DO maintain consistent spacing throughout the UI. DO use clear and concise language. DON'T overuse shadows or gradients. DON'T use too many different font sizes. DON'T sacrifice readability for aesthetics."
    }
  },
  {
    "id": "pin-food-delivery",
    "name": "Zenith Productivity Theme",
    "keywords": [
      "food",
      "delivery",
      "restaurant",
      "order",
      "meal"
    ],
    "mood": [
      "light",
      "warm"
    ],
    "domains": [
      "food"
    ],
    "previewUrl": "https://i.pinimg.com/1200x/a4/da/c0/a4dac01a8904386d248e12fd83eed07e.jpg",
    "designSystem": {
      "name": "Zenith Productivity Theme",
      "colors": {
        "primary": {
          "base": "#71C588",
          "tones": [
            "#2E4A37",
            "#3E6A4C",
            "#4E8A61",
            "#5EAA75",
            "#6EB47F",
            "#7EC488",
            "#8DC892",
            "#9DCD9B",
            "#ADDAA5",
            "#BDDEAE",
            "#CCE2B7",
            "#DCF0C1"
          ]
        },
        "secondary": {
          "base": "#F9A825",
          "tones": [
            "#64410D",
            "#7D5210",
            "#976313",
            "#B07417",
            "#C9861A",
            "#E3971D",
            "#F2A121",
            "#F4A938",
            "#F6B250",
            "#F7BA67",
            "#F9C27F",
            "#FAD796"
          ]
        },
        "tertiary": {
          "base": "#64B5F6",
          "tones": [
            "#284863",
            "#35597B",
            "#426B93",
            "#4F7DAD",
            "#5C8FC5",
            "#69A0DE",
            "#76B2F6",
            "#88BFF8",
            "#9ACCF9",
            "#ABD9FA",
            "#BDE6FB",
            "#CFEFFF"
          ]
        },
        "neutral": {
          "base": "#E0E0E0",
          "tones": [
            "#424242",
            "#525252",
            "#616161",
            "#757575",
            "#9E9E9E",
            "#BDBDBD",
            "#D5D5D5",
            "#E0E0E0",
            "#EEEEEE",
            "#F5F5F5",
            "#FAFAFA",
            "#FFFFFF"
          ]
        }
      },
      "typography": {
        "headline": {
          "family": "Poppins",
          "size": "24px",
          "weight": "600",
          "lineHeight": "1.3"
        },
        "body": {
          "family": "Poppins",
          "size": "14px",
          "weight": "400",
          "lineHeight": "1.6"
        },
        "label": {
          "family": "Poppins",
          "size": "12px",
          "weight": "500",
          "lineHeight": "1.4"
        }
      },
      "components": {
        "buttonRadius": "8px",
        "buttonPadding": "10px 24px",
        "buttonFontWeight": "500",
        "inputRadius": "8px",
        "inputBorder": "1px solid #D5D5D5",
        "inputPadding": "12px 16px",
        "inputBg": "#FFFFFF",
        "cardRadius": "12px",
        "cardShadow": "0 4px 12px rgba(0, 0, 0, 0.06)",
        "cardPadding": "24px",
        "chipRadius": "16px",
        "chipPadding": "6px 14px",
        "chipBg": "#F5F5F5",
        "fabSize": "56px",
        "fabRadius": "28px"
      }
    },
    "guide": {
      "overview": "Zenith Productivity Theme is designed for focused work environments, emphasizing clarity, and a light, encouraging atmosphere. It's aimed at reducing visual clutter and promoting efficiency through intuitive design elements.",
      "colorRules": "Use #71C588 as the primary call to action, #F9A825 for secondary or supporting interactive elements, #64B5F6 for informational cues, and #E0E0E0 for backgrounds and neutral surfaces. Avoid using primary color on large surfaces to maintain a clean look.",
      "typographyRules": "@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600&display=swap'); Headline: Poppins, 24px, 600, 1.3 line-height. Body: Poppins, 14px, 400, 1.6 line-height. Label: Poppins, 12px, 500, 1.4 line-height.",
      "elevationRules": "Employ subtle shadows for depth and layering. Use cardShadow: 0 4px 12px rgba(0, 0, 0, 0.06) for cards and subtle borders (1px solid #D5D5D5) for inputs and dividers.",
      "componentRules": "Buttons should use the primary or secondary color depending on their function and emphasis. Cards should have rounded corners (12px) and a subtle shadow. Inputs should have a light border and a white background.",
      "dosAndDonts": "DO use consistent spacing and alignment to create a clean and orderly interface. DO use colors to provide visual cues and hierarchy, but avoid excessive use of bright colors. DO test the design on different screen sizes to ensure responsiveness and usability. DON'T overcrowd the interface with too many elements or distracting animations. DON'T use low-contrast color combinations that make it difficult to read text. DON'T neglect accessibility considerations such as sufficient color contrast and keyboard navigation."
    }
  }
]