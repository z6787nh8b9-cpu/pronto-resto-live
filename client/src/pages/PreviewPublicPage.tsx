import { useParams } from "wouter";
import PublicRestaurantPage from "./PublicRestaurantPage";

/**
 * Preview wrapper for public restaurant pages
 * Extracts slug from URL params and passes to PublicRestaurantPage
 */
export default function PreviewPublicPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug || "";

  // Pass slug as prop to PublicRestaurantPage
  return <PublicRestaurantPage previewSlug={slug} />;
}
