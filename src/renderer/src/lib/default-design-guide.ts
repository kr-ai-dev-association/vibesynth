import type { DesignGuide } from '../App'

export const DEFAULT_DESIGN_GUIDE: DesignGuide = {
  overview: `Creative North Star: "The Architectural Compiler"

The goal is to evoke the focused, high-contrast atmosphere of a premium IDE while maintaining an editorial sophistication:
• Intentional Asymmetry — Breaking the 12-column grid to allow for "utility sidebars" and "offset content blocks" that mimic code structures.
• Syntactic Depth — Using color not as decoration, but as logic—defining functions, flows, and states through a precise tonal palette.
• High-End Technicality — Leveraging geometric tension of Space Grotesk to bridge human readability and machine-like efficiency.`,

  colorRules: `The "No-Line" Rule: Prohibit 1px solid borders for sectioning. Boundaries must be defined solely through background color shifts. The eye should perceive the change in depth, not a "stroke."

Surface Hierarchy & Nesting (treat as physical layers):
• Deepest (Canvas): surface_container_lowest (#000000) for the primary editor area.
• Base: background (#060e20) for the general application shell.
• Elevated Components: surface_container_high (#031d4b) for floating panels requiring immediate attention.

The "Glass & Gradient" Rule: Use Glassmorphism for floating utility bars — surface colors at 70% opacity with 20px backdrop blur. Main CTAs or active "Flow" states use a subtle linear gradient from tertiary (#47c4ff) to tertiary_container (#2db7f2) at 135° for a "glowing filament" look.`,

  typographyRules: `Utilize Space Grotesk exclusively. Its monospaced-adjacent proportions lend technical authority.

• Display (lg/md): Reserved for data visualization or landing hero. Use primary color with tight letter-spacing (-0.02em).
• Headline (sm/md): Workspace headers. Always on_surface (#dee5ff) for maximum contrast.
• Title (sm): Panel headers. Pair with label-sm for metadata (file sizes, timestamps) in on_surface_variant (#91aaeb).
• Body (md): Technical documentation and user text. Line height must be generous (1.6) to prevent "code fatigue."`,

  elevationRules: `"Up" does not mean "Shadow." It means "Lighter."

• The Layering Principle: Depth by "stacking." Place surface_container_lowest card on surface_container_low section for soft "inset" feel.
• Ambient Shadows: For floating elements (context menus), use 120px blur at 8% opacity with surface_container_lowest color. Soft atmospheric occlusion, not drop shadow.
• The Ghost Border: If accessibility requires container definition, use outline_variant (#2b4680) at 15% opacity. Creates a "glint" on the edge rather than a hard line.`,

  componentRules: `Buttons & Actions:
• Primary: Solid block of primary (#b9c8de) with on_primary text. No border. Radius: md (0.375rem).
• Tertiary ("The Ghost"): No background, tertiary text. On hover, subtle surface_bright glow behind text.

Logic Chips: secondary_container backgrounds with on_secondary_container text. Full roundedness (pill-shaped) to contrast against sharp workspace edges.

Technical Inputs:
• Fields: Background = surface_container_low. Active state = 2px tertiary bottom bar (mimicking IDE cursor).
• Forbid Dividers: Use 16px vertical whitespace or surface_container_highest on hover to separate items.

The Node Card: surface_container_low with Ghost Border. Selected state: border opacity jumps to 100% using tertiary token ("powered-on" effect).`,

  dosAndDonts: `DO:
• Use tertiary (#47c4ff) sparingly for "Success" or "Active Logic" states — it is the "spark."
• Allow intentional whitespace. The "Technical" look comes from clarity, not clutter.
• Use surface_container_lowest for the main canvas to make content pop.

DON'T:
• Use 1px solid lines to separate header from sidebar. Use tonal shift between surface_dim and surface_container.
• Use standard grey shadows. Shadows should be deep blue-tints or non-existent.
• Use "Default" roundedness (0.25rem) for everything. Mix none for structural containers and full for interactive chips.`,
}
