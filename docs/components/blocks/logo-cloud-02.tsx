import Link from "next/link";
import { useTheme } from "next-themes";
import { Backlight } from "@/components/ui/backlight";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const logos = [
  {
    name: "datHere",
    src: "/media/logos/datHere_logo.png",
    href: "https://dathere.com",
  },
  {
    name: "Center for Geospatial Solutions",
    src: "/media/logos/CGS-Logo.webp",
    href: "https://cgsearth.org",
  },
  {
    name: "U.S. Geological Survey",
    src: "/media/logos/USGS_logo_green.png",
    href: "https://usgs.gov",
  },
  {
    name: "New Mexico Water Data Initiative",
    src: "/media/logos/nmwd_logo.png",
    href: "https://newmexicowaterdata.org/",
  },
  {
    name: "New Mexico Bureau of Geology and Mineral Resources",
    src: "/media/logos/nmbgmr_logo.png",
    href: "https://geoinfo.nmt.edu/",
  },
  {
    name: "Texas Geographic Information Office",
    src: "/media/logos/TxGIO_logo.png",
    href: "https://geographic.texas.gov/",
  },
  {
    name: "Internet of Water",
    src: "/media/logos/internet-of-water-logo.png",
    href: "https://internetofwater.org",
  },
  {
    name: "Lincoln Institute of Land Policy",
    src: "/media/logos/lilp-logo.svg",
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
        <div className="mt-12 flex flex-col md:grid md:grid-cols-3 w-fit p-4 mx-auto gap-10 items-center rounded-2xl">
          {logos.slice(0, 6).map((logo) => (
            <Backlight key={logo.name} blur={theme === "dark" ? 5 : 0}>
              <Tooltip delayDuration={200}>
                <TooltipTrigger asChild>
                  <Link
                    href={logo.href}
                    className="flex flex-col h-full items-center my-auto mx-auto bg-card bg-blue-200 dark:bg-blue-300 p-4 rounded-xl"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={logo.src} alt={logo.name} className="h-16" />
                  </Link>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{logo.name}</p>
                </TooltipContent>
              </Tooltip>
            </Backlight>
          ))}
          <div className="flex flex-col md:flex-row justify-center gap-8 col-span-3">
            {logos.slice(6).map((logo) => (
              <Backlight key={logo.name} blur={theme === "dark" ? 5 : 0}>
                <Tooltip delayDuration={200}>
                  <TooltipTrigger asChild>
                    <Link
                      href={logo.href}
                      className="flex flex-col h-fit items-center my-auto mx-auto justify-center bg-card bg-blue-200 dark:bg-blue-300 p-4 rounded-xl"
                    >
                      <div>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={logo.src} alt={logo.name} className="h-16" />
                      </div>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{logo.name}</p>
                  </TooltipContent>
                </Tooltip>
              </Backlight>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
