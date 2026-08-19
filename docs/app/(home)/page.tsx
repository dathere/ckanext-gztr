/** biome-ignore-all lint/suspicious/noArrayIndexKey: Would need to look into this trivial issue */
"use client";

import { CodeBlock } from "fumadocs-ui/components/codeblock";
import defaultMdxComponents from "fumadocs-ui/mdx";
import { cn } from "@/lib/cn";
import {
  BlocksIcon,
  GitMergeIcon,
  HomeIcon,
  LayoutListIcon,
  MapPinnedIcon,
  MousePointerClickIcon,
  PenLineIcon,
  SquareDashedMousePointerIcon,
  TerminalIcon,
  Trash2Icon,
  ZapIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { type HTMLProps, type ReactNode, useEffect, useState } from "react";
import { Pre } from "@/components/codeblock";
import { Button, buttonVariants } from "@/components/ui/button";
import SelectFeaturesDemo from "./select-features-demo.gif";
import SearchDemo from "./search-demo.gif";
import { cva } from "class-variance-authority";
import { Card, CardContent } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";

export default function HomePage() {
  const gridColor =
    "color-mix(in oklab, var(--color-fd-primary) 10%, transparent)";
  const { Card, Cards } = defaultMdxComponents;
  return (
    <>
      <div
        className="absolute inset-x-0 top-[360px] h-[250px] max-md:hidden"
        style={{
          background: `repeating-linear-gradient(to right, ${gridColor}, ${gridColor} 1px,transparent 1px,transparent 50px), repeating-linear-gradient(to bottom, ${gridColor}, ${gridColor} 1px,transparent 1px,transparent 50px)`,
        }}
      />
      <main className="container relative max-w-[1100px] px-2 py-4 z-2 lg:py-8 mx-auto">
        <div
          style={{
            background:
              "repeating-linear-gradient(to bottom, transparent, color-mix(in oklab, var(--color-fd-primary) 1%, transparent) 500px, transparent 1000px)",
          }}
        >
          <div className="relative mb-4">
            <Hero />
            {/* <Why /> */}
          </div>
        </div>
        <hr className="mt-12 mb-4" />
        <footer className="flex flex-col bg-brand-secondary pb-12 text-brand-secondary-foreground rounded-2xl">
          <p className="mb-1 text-xl font-semibold">ckanext-gztr</p>
          <p className="text-xs">
            Provided by{" "}
            <a
              href="https://dathere.com"
              target="_blank"
              className="font-medium text-blue-400"
              rel="noopener"
            >
              datHere
            </a>
            .{" "}
            <a
              href="https://dathere.com/privacy-policy/"
              target="_blank"
              className="font-medium text-blue-400"
              rel="noopener"
            >
              Privacy Policy
            </a>
            .
          </p>
        </footer>
      </main>
    </>
  );
}

function Hero() {
  return (
    <div className="relative z-2 flex flex-col border-x border-t bg-fd-background/80 px-4 pt-12 max-md:text-center md:px-12 md:pt-16 [.uwu_&]:hidden overflow-hidden">
      <div
        className="absolute inset-0 z-[-1] blur-2xl hidden dark:block"
        style={{
          maskImage:
            "linear-gradient(to bottom, transparent, white, transparent)",
          background:
            "repeating-linear-gradient(65deg, var(--color-blue-500), var(--color-blue-500) 12px, color-mix(in oklab, var(--color-blue-600) 30%, transparent) 20px, transparent 200px)",
        }}
      />
      <div
        className="absolute inset-0 z-[-1] blur-2xl dark:hidden"
        style={{
          maskImage:
            "linear-gradient(to bottom, transparent, white, transparent)",
          background:
            "repeating-linear-gradient(65deg, var(--color-purple-300), var(--color-purple-300) 12px, color-mix(in oklab, var(--color-blue-600) 30%, transparent) 20px, transparent 200px)",
        }}
      />
      <h1 className="mb-8 text-4xl font-medium md:hidden">ckanext-gztr</h1>
      <h1 className="mb-8 max-w-[800px] text-4xl font-medium max-md:hidden">
        <span className="text-5xl">
          ckanext-gztr <MapPinnedIcon className="inline-block w-10 h-10 pb-1" />
        </span>
        <br />
        Interactive gazetteer maps for your datasets.
      </h1>
      <p className="mb-2 text-fd-muted-foreground md:max-w-[80%] md:text-xl">
        ckanext-gztr is a{" "}
        <Link href="https://ckan.org" className="text-blue-400">
          CKAN
        </Link>{" "}
        extension that lets you associate features on an interactive map for
        each dataset, perform geospatial search, expose a <Link href="https://stacspec.org" className="text-blue-400">STAC</Link> API, and <Link href="/docs/features" className="text-blue-400">more</Link>.
      </p>
      <p className="mb-8 text-fd-muted-foreground md:max-w-[80%] md:text-sm">
        Provided by{" "}
        <Link className="text-fd-info" href="https://dathere.com">
          datHere
        </Link>
        .
        {/* . Supported by the <Link className="text-fd-info" href="https://cgsearth.org/">Center for Geospatial Sciences</Link> and the <Link className="text-fd-info" href="https://www.usgs.gov/">U.S. Geological Survey (USGS)</Link>. */}
      </p>
      <div className="inline-flex items-center gap-3 max-md:mx-auto mb-4 md:mb-0">
        <Link
          href="/docs"
          className={cn(
            buttonVariants({ size: "lg", className: "rounded-full" }),
          )}
        >
          Get Started
        </Link>
        <Link
          href="https://github.com/dathere/ckanext-gztr"
          className={cn(
            buttonVariants({
              variant: "secondary",
              size: "lg",
              className: "rounded-full",
            }),
          )}
        >
          Source Code
        </Link>
      </div>
      {/* <Cards>
        <Card icon={<ZapIcon />} href="/docs/builder" title="Quick start">
          Install ckanext-gztr on your CKAN instance
        </Card>
        <Card icon={<BlocksIcon />} href="/docs/builder" title="Builder">
          Customize your installation with an interactive web GUI
        </Card>
        <Card
          icon={<HomeIcon />}
          href="/docs/reference/installation-architecture"
          title="Installation architecture"
        >
          Learn about where files are installed after running ckan-devstaller
        </Card>
        <Card
          icon={<GitMergeIcon />}
          href="https://github.com/dathere/ckanext-gztr"
          title="Source code"
        >
          View the source code of ckanext-gztr on GitHub
        </Card>
      </Cards> */}
      <FeaturesCarousel />
      {/* TODO: More sections, e.g. problems solved, software architecture, portals using extension, learn/collaborate, etc. */}
      {/* Refer to stacspec.org and Apache SedonaDB for examples of home pages */}
    </div>
  );
}

function FeaturesCarousel() {
  const [api, setApi] = useState<CarouselApi>()
  const [current, setCurrent] = useState(0)
  const features = [
    {
      src: "/media/nmwdc-data-publisher-gazetteer-demo.mp4",
      type: "video",
      name: "Select map features",
    },
    {
      src: "/media/nmwdc-public-gazetteer-search-demo.mp4",
      type: "video",
      name: "Search by bounding box",
    },
    {
      src: "/media/datasets-page.png",
      type: "image",
      name: "Minimaps"
    },
    {
      src: "/media/gztr_collection_create_flow.excalidraw.png",
      type: "image",
      name: "Interact with STAC API"
    },
    {
      src: "/media/geoconnex-diagram.png",
      type: "image",
      name: "Integrate with Geoconnex"
    }
  ];

  useEffect(() => {
    if (!api) {
      return
    }

    setCurrent(api.selectedScrollSnap() + 1)

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap() + 1)
    })
  }, [api])

  return (
    <div className="mx-auto max-w-[75%] md:max-w-[90%] mt-8">
      <Carousel setApi={setApi} opts={{ loop: true }} className="w-full">
        <CarouselContent>
          {features.map((feature, index) => (
            <CarouselItem key={index}>
              <Card className="border-none shadow-none">
                <CardContent className="flex justify-center p-0">
                  <div className="flex flex-col justify-center">{feature.type === "video" ? <video key={index} className={cn(
                      "rounded-xl w-full select-none duration-1000 animate-in fade-in md:-mb-60 slide-in-from-bottom-12 lg:-mb-0"
                    )} style={{ borderRadius: "1rem" }} autoPlay muted loop controls={false} src={feature.src} /> :
                  <Image
                    key={index}
                    src={feature.src}
                    alt="preview"
                    priority
                    width={500}
                    height={500}
                    className={cn(
                      "rounded-xl w-full select-none duration-1000 animate-in fade-in md:-mb-60 slide-in-from-bottom-12 lg:-mb-0"
                    )}
                  />}
                  <Button className="cursor-pointer dark:hover:bg-sky-700 text-primary hover:bg-sky-200 dark:text-current mt-2 md:text-lg w-fit mx-auto border-2 rounded-xl bg-sky-100 dark:bg-sky-800 p-1" onClick={() => {api?.scrollNext()}}>{feature.name}</Button>
                  </div>
                </CardContent>
              </Card>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="cursor-pointer" />
        <CarouselNext className="cursor-pointer" />
      </Carousel>
      {/* <div className="py-2 text-center text-sm text-muted-foreground">
        {features.name}
      </div> */}
    </div>
  )
}

function Why() {
  return (
    <div className="relative overflow-hidden border-x border-t p-2">
      <WhyInteractive
        codeblockInstall={
          <CodeBlock lang="bash">
            <Pre className="text-wrap pl-4">./ckan-devstaller</Pre>
          </CodeBlock>
        }
        codeblockUninstall={
          <CodeBlock lang="bash">
            <Pre className="text-wrap pl-4">./ckan-devstaller uninstall</Pre>
          </CodeBlock>
        }
      />
    </div>
  );
}

function WhyInteractive(props: {
  codeblockInstall: ReactNode;
  codeblockUninstall: ReactNode;
}) {
  const [active, setActive] = useState(0);
  const items = [
    [
      <MousePointerClickIcon className="w-4 h-4 inline-block" key={0} />,
      "Select preset map features",
      <p>
        One of the primary goals of ckan-devstaller is to ease installation of
        CKAN for development. Built with Rust for speed and streamlining
        installation with{" "}
        <a href="https://github.com/tino097/ckan-compose/tree/ckan-devstaller">
          ckan-compose
        </a>
        , ckan-devstaller improves installation speeds{" "}
        <strong>from hours/days to just minutes</strong> depending on your
        download speed.
      </p>,
    ],
    [
      <PenLineIcon className="w-4 h-4 inline-block" key={1} />,
      "Draw custom features",
      <>
        <p>
          Try out the interactive web GUI for customizing your CKAN
          installation. You can select:
        </p>
        <ul>
          <li>Presets</li>
          <li>CKAN version</li>
          <li>Extensions</li>
          <li>Features</li>
        </ul>
        <p>
          Then you can copy the provided ckan-devstaller command to run your
          selected configuration.
        </p>
      </>,
    ],
    [
      <LayoutListIcon className="w-4 h-4 inline-block" key={2} />,
      "View interactive map results",
      <>
        <p>
          We've kept development use cases in mind while developing
          ckan-devstaller, such as:
        </p>
        <ul>
          <li>Trying out a new version of CKAN</li>
          <li>Developing CKAN extensions and themes</li>
        </ul>
      </>,
    ],
    [
      <SquareDashedMousePointerIcon className="w-4 h-4 inline-block" key={3} />,
      "Search by bounding box",
      <>
        <p>
          After you've installed CKAN with ckan-devstaller, you can uninstall
          CKAN with ease. This allows for quickly re-installing CKAN for a
          different use case.
        </p>
        {props.codeblockUninstall}
      </>,
    ],
  ];

  return (
    <div
      id="why-interactive"
      className="flex flex-col-reverse gap-3 md:flex-row md:min-h-[200px]"
    >
      <div className="flex flex-col">
        {items.map((item, i) => (
          <button
            key={item[1] as string}
            ref={(element) => {
              if (!element || i !== active) return;
            }}
            type="button"
            className={cn(
              "transition-colors text-nowrap border border-transparent rounded-lg px-3 py-2.5 text-start text-sm text-fd-muted-foreground font-medium",
              i === active
                ? "text-fd-primary bg-fd-primary/10 border-fd-primary/10"
                : "hover:text-fd-accent-foreground/80 cursor-pointer",
            )}
            onClick={() => {
              setActive(i);
            }}
          >
            {item[0]} {item[1]}
          </button>
        ))}
      </div>
      <style>
        {`
        @keyframes why-interactive-x {
          from {
            width: 0px;
          }
          
          to {
            width: 100%;
          }
        }`}
      </style>

      <div className="flex-1 p-4 border border-fd-primary/10 bg-fd-card/40 rounded-lg shadow-lg">
        {active === 0 ? (
          <WhyPanel>
            <h3>
              <MousePointerClickIcon className="w-4 h-4 inline-block mr-1 mb-1" />
              {items[0][1]}
            </h3>
            {items[0][2]}
            <div className="flex gap-2">
              <Link
                href="/docs/builder"
                className={cn(buttonVariants(), "not-prose")}
              >
                Get started
              </Link>
            </div>
          </WhyPanel>
        ) : null}
        {active === 1 ? (
          <WhyPanel>
            <h3>
              <PenLineIcon className="w-4 h-4 inline-block mr-1 mb-1" />
              {items[1][1]}
            </h3>
            {items[1][2]}
            <div className="mt-4 flex flex-row items-center gap-1.5 not-prose">
              <Link href="/docs/builder" className={cn(buttonVariants())}>
                Try out the Builder
              </Link>
            </div>
          </WhyPanel>
        ) : null}
        {active === 2 ? (
          <WhyPanel>
            <h3>
              <LayoutListIcon className="w-4 h-4 inline-block mr-1 mb-1" />
              {items[2][1]}
            </h3>
            {items[2][2]}
            <div className="flex gap-2">
              <Link
                href="/docs/reference/installation-architecture"
                className={cn(buttonVariants(), "not-prose")}
              >
                View the installation architecture
              </Link>
              <Link
                href="https://github.com/dathere/ckan-devstaller"
                className={cn(buttonVariants({ variant: "ghost" }))}
              >
                Source code
              </Link>
            </div>
          </WhyPanel>
        ) : null}
        {active === 3 ? (
          <WhyPanel>
            <h3>
              <SquareDashedMousePointerIcon className="w-4 h-4 inline-block mr-1 mb-1" />
              {items[2][1]}
            </h3>
            {items[3][2]}
            <Link
              href="/docs/tutorials/uninstall-ckan"
              className={cn(buttonVariants(), "not-prose")}
            >
              Learn more about uninstalling
            </Link>
          </WhyPanel>
        ) : null}
      </div>
    </div>
  );
}

function WhyPanel(props: HTMLProps<HTMLDivElement>) {
  return (
    <div
      {...props}
      className={cn(
        "duration-700 animate-in fade-in text-sm prose",
        props.className,
      )}
    >
      {props.children}
    </div>
  );
}

const previewButtonVariants = cva(
  "w-48 h-8 text-sm font-medium transition-colors rounded-full",
  {
    variants: {
      active: {
        true: "text-fd-primary-foreground",
        false: "text-fd-muted-foreground",
      },
    },
  },
);
