import type { INestApplication } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { openApiSchemas } from "./contracts.js";

export function configureOpenApi(app: INestApplication) {
  const config = new DocumentBuilder()
    .setTitle("Open ERP Ecosystem API")
    .setDescription("Public REST contracts for the modular ERP platform.")
    .setVersion("0.1.0")
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  type ComponentSchemas = NonNullable<NonNullable<typeof document.components>["schemas"]>;
  const schemas = openApiSchemas as ComponentSchemas;
  document.components = {
    ...document.components,
    schemas: {
      ...document.components?.schemas,
      ...schemas
    }
  };

  SwaggerModule.setup("docs", app, document, {
    jsonDocumentUrl: "/openapi.json"
  });

  return document;
}
