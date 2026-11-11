import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

// Guards against "builds fine but fails to start": every module's dependency injection must resolve.
describe("AppModule", () => {
  it("boots with all modules wired", async () => {
    const app = await NestFactory.createApplicationContext(AppModule, { logger: ["error"] });
    expect(app).toBeDefined();
    await app.close();
  }, 30000);
});
