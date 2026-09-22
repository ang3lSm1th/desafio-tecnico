import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { UploadModule } from './upload/upload.module.js';
import { databaseConfig } from './config/database.config.js';

@Module({
  imports: [
    TypeOrmModule.forRoot(databaseConfig),
    UploadModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
