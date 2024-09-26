import { z } from "zod";

const Settings = z.object({}).catchall(z.any());
type Settings = z.infer<typeof Settings>

const VsCodeExtensions = z.array(z.string())
type VsCodeExtensions = z.infer<typeof VsCodeExtensions>

export const DevContainerConfig = z.object({
    customizations: z.object({
        vscode: z.optional(z.object({
            settings: z.optional(Settings),
            extensions: z.optional(VsCodeExtensions),
        })),
    }),
})
type DevContainerConfig = z.infer<typeof DevContainerConfig>

// function x() {
//     DevContainerConfig.safeParse("")
// }