import { docs } from "collections/server";
import { type InferPageType, loader } from "fumadocs-core/source";
import { icons } from "lucide-react";
import { createElement } from "react";

// See https://fumadocs.vercel.app/docs/headless/source-api for more info
export const source = loader({
  baseUrl: "/docs",
  source: docs.toFumadocsSource(),
  icon(icon) {
    if (!icon) return;
    if (icon.toLowerCase() === "census")
      return createElement("img", {
        src: "/media/us_census_logo.svg",
        width: "48px",
        height: "48px",
        style: {
          filter:
            "invert(48%) sepia(13%) saturate(7434%) hue-rotate(217deg) brightness(101%) contrast(103%)",
        },
      });
    if (icon.toLowerCase() === "jupyter")
      return createElement("img", {
        src: "/media/logos/devicon--jupyter-wordmark.svg",
        width: "20px",
        height: "20px",
      });
    if (icon.toLowerCase() === "airflow")
      return createElement("img", {
        src: "/media/logos/devicon--apacheairflow.svg",
        width: "16px",
        height: "16px",
      });
    if (icon.toLowerCase() === "rq")
      return createElement("img", {
        src: "/media/logos/rq_logo.png",
        width: "16px",
        height: "16px",
      });
    if (icon.toLowerCase() === "prefect")
      return createElement("img", {
        className: "dark:invert",
        src: "/media/logos/simple-icons--prefect.svg",
        width: "16px",
        height: "16px",
      });
    if (icon.toLowerCase() === "cron")
      return createElement("img", {
        className: "dark:invert",
        src: "/media/logos/arcticons--cron.svg",
        width: "16px",
        height: "16px",
      });
    if (icon in icons) return createElement(icons[icon as keyof typeof icons]);
  },
});

export function getPageImage(page: InferPageType<typeof source>) {
  const segments = [...page.slugs, "image.png"];

  return {
    segments,
    url: `/og/docs/${segments.join("/")}`,
  };
}

export async function getLLMText(page: InferPageType<typeof source>) {
  const processed = await page.data.getText("processed");

  return `# ${page.data.title} (${page.url})

${processed}`;
}
