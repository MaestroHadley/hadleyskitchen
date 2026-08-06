import Link from "next/link";
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";
import { PageHeader } from "@/components/page-header";
import { RecipeImporter } from "@/components/recipe-importer";

export default function RecipeImportPage() {
  const aiConfigured = process.env.RECIPE_IMPORT_AI_ENABLED === "true" && Boolean(process.env.GEMINI_API_KEY);
  return <>
    <PageHeader
      eyebrow="Formula library"
      title="Import a recipe"
      description="Choose a private guided import or optional free Google AI assistance."
      actions={<Link className="button secondary" href="/recipes"><ArrowLeft />Recipe library</Link>}
    />
    <RecipeImporter aiConfigured={aiConfigured} />
  </>;
}
