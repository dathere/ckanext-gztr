import { generateFiles } from 'fumadocs-openapi';
import { createOpenAPI } from 'fumadocs-openapi/server';

void generateFiles({
  meta: {
    folderStyle: "separator"
  },
  groupBy: "tag",
  input: createOpenAPI({
    input: ["./lib/openapi.yml"],
  }),
  output: './content/docs/api-reference',
  // we recommend to enable it
  // make sure your endpoint description doesn't break MDX syntax.
  includeDescription: true,
});