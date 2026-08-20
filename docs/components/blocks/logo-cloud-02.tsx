import Link from "next/link";
import { Backlight } from "../ui/backlight";
import { useTheme } from "next-themes";

const logos = [
  {
    name: "datHere",
    src: "/media/logos/datHere_logo.png",
    href: "https://dathere.com",
  },
  {
    name: "Center for Geospatial Solutions",
    src: "/media/logos/CGS_logo.webp",
    href: "https://cgsearth.org",
  },
  {
    name: "Internet of Water",
    src: "/media/logos/internet-of-water-logo.png",
    href: "https://internetofwater.org",
  },
  {
    name: "Lincoln Institute of Land Policy",
    src: "/media/logos/lilp-logo.webp",
    href: "https://www.lincolninst.edu/",
  },
];

export default function LogoCloud02() {

  const { theme } = useTheme();

  return (
    <section className="bg-background">
      <div className="mx-auto max-w-6xl px-6">
        <h2 className="text-center font-semibold text-2xl tracking-tight text-foreground sm:text-3xl">
          Built as a collaborative effort.
        </h2>
        <div className="mt-12 flex w-fit p-4 mx-auto gap-8 overflow-hidden rounded-2xl">
          {logos.map((logo) => (
            <Backlight key={logo.name} blur={theme === "dark" ? 5 : 0}>
            <Link
              href={logo.href}
              className="flex flex-col h-fit items-center my-auto mx-auto justify-center bg-card bg-blue-200 dark:bg-blue-300 p-4 rounded-xl"
            >
              <div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={logo.src}
                  alt={logo.name}
                  className={logo.name === "datHere" ? "h-12" : "h-16"}
                />
              </div>
            </Link></Backlight>
          ))}
        </div>
      </div>
    </section>
  );
}
