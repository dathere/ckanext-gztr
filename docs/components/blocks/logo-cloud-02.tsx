import Link from "next/link";

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
];

export default function LogoCloud02() {
  return (
    <section className="bg-background">
      <div className="mx-auto max-w-6xl px-6">
        <h2 className="text-center font-semibold text-2xl tracking-tight text-foreground sm:text-3xl">
          Built as a collaborative effort.
        </h2>
        <div className="mt-12 grid grid-cols-2 w-fit p-4 mx-auto gap-px overflow-hidden rounded-2xl">
          {logos.map((logo) => (
            <Link
              href={logo.href}
              className="flex flex-col h-fit items-center my-auto mx-auto justify-center bg-card bg-sky-100 dark:bg-sky-200 p-4 rounded-xl"
            >
              <div key={logo.name}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={logo.src}
                  alt={logo.name}
                  className={logo.name === "datHere" ? "h-12" : "h-16"}
                />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
