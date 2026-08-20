"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm, useFormState } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
  FieldTitle,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { CodeBlock, Pre } from "./codeblock";

const formSchema = z.object({
  ckan_instance_name: z.string().min(1).max(100),
  catalog_id: z.string().min(1).max(100).lowercase(),
  ckan_instance_url: z.url(),
  collection_id: z.string().min(1).max(100).lowercase(),
  collection_title: z.string().min(1).max(100)
});

const StacCatalogGenerator = () => {

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ckan_instance_name: "",
      catalog_id: "",
      ckan_instance_url: "",
    },
  });

  const ckan_instance_name = form.watch("ckan_instance_name");
  const catalog_id = form.watch("catalog_id");
  const ckan_instance_url = form.watch("ckan_instance_url");
  const collection_id = form.watch("collection_id");
  const collection_title = form.watch("collection_title");

  return (
    <div className="grid grid-cols-1">
      <form id="stac-generator-form">
      <FieldSet className="w-full px-4 mt-8">
        <p className="text-xl m-0!">
          Enter details about your CKAN instance and geospatial data
        </p>
        <FieldGroup>
          <Controller
            name="ckan_instance_name"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="ckan_instance_name">
                  CKAN instance name
                </FieldLabel>
                <FieldDescription className="mb-0!">
                  What is your CKAN instance called?
                </FieldDescription>
                <Input
                  {...field}
                  id="ckan_instance_name"
                  aria-invalid={fieldState.invalid}
                  type="text"
                  placeholder="New Mexico Water Data Catalog"
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
          <Controller
            name="catalog_id"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="catalog_id">Catalog ID</FieldLabel>
                <FieldDescription className="mb-0!">
                  Provide a basic lowercase alphabetical ID (can be hyphenated)
                </FieldDescription>
                <Input {...form.register("catalog_id")} id="catalog_id" type="text" placeholder="nmwdc" />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
          <Controller
            name="ckan_instance_url"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="ckan_instance_url">
                  CKAN instance URL
                </FieldLabel>
                <FieldDescription className="mb-0!">
                  What is the URL of your CKAN instance? (no slash at the end
                  please!)
                </FieldDescription>
                <Input
                  {...form.register("ckan_instance_url")}
                  id="ckan_instance_url"
                  type="text"
                  placeholder="https://catalog.newmexicowaterdata.org"
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
          <Controller
            name="collection_id"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="collection_id">
                  STAC Collection ID
                </FieldLabel>
                <FieldDescription className="mb-0!">
                  Provide a lowercase ID for your STAC Collection (can be hyphenated)
                </FieldDescription>
                <Input
                  {...form.register("collection_id")}
                  id="collection_id"
                  type="text"
                  placeholder="public-water-systems"
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
          <Controller
            name="collection_title"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="collection_title">
                  STAC Collection title
                </FieldLabel>
                <FieldDescription className="mb-0!">
                  Provide a human-readable title about your STAC Collection
                </FieldDescription>
                <Input
                  {...form.register("collection_title")}
                  id="collection_title"
                  type="text"
                  placeholder="Public Water Systems"
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
          {/* TODO: Collections info of arbitrary size */}
        </FieldGroup>
      </FieldSet>
      </form>
      <CodeBlock lang="json">
        <Pre className="text-wrap pl-4">{`{
  "id": ${catalog_id ? `"${catalog_id}"` : `"nmwdc"`},
  "stac_version": "1.1.0",
  "type": "Catalog",
  "title": ${ckan_instance_name ? `"${ckan_instance_name}"` : `"New Mexico Water Data Catalog"`},
  "description": "${`Geospatial collections and features used for dataset publishing and search by the ${ckan_instance_name ?? "New Mexico Water Data Catalog"}, organized through the SpatioTemporal Asset Catalogs (STAC) specification.`}",
  "links": [
    {
      "href": "${`${ckan_instance_url ?? "https://catalog.newmexicowaterdata.org"}/gztr/stac`}",
      "rel": "self",
      "type": "application/json"
    },
    {
      "href": "${`${ckan_instance_url ?? "https://catalog.newmexicowaterdata.org"}/gztr/stac`}",
      "rel": "root",
      "type": "application/json"
    },
    {
      "href": "${`${ckan_instance_url ?? "https://catalog.newmexicowaterdata.org"}/gztr/stac/collections`}",
      "rel": "collections",
      "type": "application/json"
    },
    {
      "href": "${`${ckan_instance_url ?? "https://catalog.newmexicowaterdata.org"}/gztr/stac/collections/${collection_id ?? "public-water-systems"}`}",
      "rel": "child",
      "type": "application/json",
      "title": "${collection_title ?? "Public Water Systems"}"
    }
  ]
}
`}</Pre>
      </CodeBlock>
    </div>
  );
};

export { StacCatalogGenerator };
