import { Module } from "@nestjs/common";
import { CertificatesController } from "./certificates.controller";
import { CertificatesService } from "./certificates.service";
import { PdfCertificateService } from "./pdf-certificate.service";

@Module({ controllers: [CertificatesController], providers: [CertificatesService, PdfCertificateService] })
export class CertificatesModule {}
