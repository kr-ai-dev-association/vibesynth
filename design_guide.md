# Design System: The Syntactic Slate



## 1. Overview & Creative North Star

**Creative North Star: "The Architectural Compiler"**

The goal is to evoke the focused, high-contrast atmosphere of a premium IDE (Integrated Development Environment) while maintaining an editorial sophistication. We achieve this through:

* **Intentional Asymmetry:** Breaking the 12-column grid to allow for "utility sidebars" and "offset content blocks" that mimic code structures.

* **Syntactic Depth:** Using color not as decoration, but as logic—defining functions, flows, and states through a precise tonal palette.

* **High-End Technicality:** Leveraging the geometric tension of *Space Grotesk* to bridge the gap between human readability and machine-like efficiency.



---



## 2. Colors: The Tonal Spectrum

We move beyond flat backgrounds. The color palette is designed to create a sense of deep, recessed space punctuated by glowing logic.



### The "No-Line" Rule

**Prohibit 1px solid borders for sectioning.** Boundaries must be defined solely through background color shifts. To separate the navigation from the workspace, place a `surface-container-low` section against the `surface` background. The eye should perceive the change in depth, not a "stroke."



### Surface Hierarchy & Nesting

Treat the app interface as a series of physical layers. Use the hierarchy to guide the user's focus:

* **Deepest (Canvas):** `surface_container_lowest` (#000000) for the primary editor area.

* **Base:** `background` (#060e20) for the general application shell.

* **Elevated Components:** `surface_container_high` (#031d4b) for panels that float or require immediate attention.



### The "Glass & Gradient" Rule

To ensure the app doesn't feel like a static 2010 dashboard, use **Glassmorphism** for floating utility bars. Apply `surface` colors at 70% opacity with a `20px` backdrop blur.

* **Signature Texture:** Main CTAs or active "Flow" states should utilize a subtle linear gradient from `tertiary` (#47c4ff) to `tertiary_container` (#2db7f2) at a 135-degree angle. This provides a "glowing filament" look against the slate background.



---



## 3. Typography: Geometric Logic

We utilize **Space Grotesk** exclusively. Its monospaced-adjacent proportions lend an air of technical authority to the app.



* **Display (lg/md):** Reserved for high-level data visualization or landing hero sections. Use `primary` color with tight letter-spacing (-0.02em).

* **Headline (sm/md):** Used for workspace headers. These should always be `on_surface` (#dee5ff) to ensure maximum contrast.

* **Title (sm):** The workhorse for panel headers. Pair with `label-sm` for "metadata" (e.g., file sizes, timestamps) in `on_surface_variant` (#91aaeb).

* **Body (md):** All technical documentation and user-generated text. Line height must be generous (1.6) to prevent "code fatigue."



---



## 4. Elevation & Depth: Tonal Layering

In the app, "Up" does not mean "Shadow." It means "Lighter."



* **The Layering Principle:** Depth is achieved by "stacking." Place a `surface_container_lowest` card on a `surface_container_low` section to create a soft, natural "inset" feel.

* **Ambient Shadows:** If a floating element (like a context menu) requires a shadow, use a `120px` blur at 8% opacity using the `surface_container_lowest` color. It should feel like a soft atmospheric occlusion, not a drop shadow.

* **The Ghost Border:** If accessibility requires a container definition, use the **Ghost Border**: `outline_variant` (#2b4680) at 15% opacity. This creates a "glint" on the edge rather than a hard line.



---



## 5. Components



### Buttons & Actions

* **Primary:** A solid block of `primary` (#b9c8de) with `on_primary` text. No border. Radius: `md` (0.375rem).

* **Tertiary (The "Ghost"):** No background, `tertiary` text. On hover, a subtle `surface_bright` glow appears behind the text.



### Logic Chips

* Used for tagging nodes in a flow. Use `secondary_container` backgrounds with `on_secondary_container` text. These should be `full` roundedness (pill-shaped) to contrast against the sharp edges of the workspace.



### Technical Inputs

* **Fields:** Background should be `surface_container_low`. The active state is indicated by a 2px `tertiary` bottom bar, mimicking an IDE cursor.

* **Forbid Dividers:** In lists or settings panels, use `16px` of vertical white space or a shift to `surface_container_highest` on hover to separate items.



### Custom Component: The Node Card

* Uses `surface_container_low` with a `Ghost Border`. When selected, the border opacity jumps to 100% using the `tertiary` token, creating a "powered-on" effect.



---



## 6. Do’s and Don’ts



### Do

* **DO** use `tertiary` (#47c4ff) sparingly for "Success" or "Active Logic" states. It is the "spark" in the system.

* **DO** allow for intentional white space. The "Technical" look comes from clarity, not clutter.

* **DO** use `surface_container_lowest` for the main canvas to make your nodes/content pop.



### Don’t

* **DON'T** use 1px solid lines to separate your header from your sidebar. Use a tonal shift between `surface_dim` and `surface_container`.

* **DON'T** use standard grey shadows. Shadows should be deep blue-tints or non-existent.

* **DON'T** use "Default" roundedness (0.25rem) for everything. Mix `none` for structural containers and `full` for interactive chips to create visual rhythm.