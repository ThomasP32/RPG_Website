import { AppModule } from '@app/app.module';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

const bootstrap = async () => {
    const app = await NestFactory.create(AppModule); // creation d'une instance de l'application
    app.setGlobalPrefix('api'); // ajoute un préfixe global à toute les routes (/courses devient /api/courses)
    app.useGlobalPipes(new ValidationPipe()); // verifie les données du corps de la requete, param url, etc
    app.enableCors();

    const config = new DocumentBuilder() // configure swagger qui genere documentation interactive de l'api
        .setTitle('Cadriciel Serveur')
        .setDescription('Serveur du projet de base pour le cours de LOG2990')
        .setVersion('1.0.0')
        .build();
    const document = SwaggerModule.createDocument(app, config); // genere le document swagger pour l'app avec les config
    SwaggerModule.setup('api/docs', app, document); // fait que lorsque taccede a /api/docs dans ton nav tu vois la documentation
    SwaggerModule.setup('', app, document); // meme chose mais a lurl racine

    await app.listen(process.env.PORT); // idique decouter un port specifique pour les requete
};

bootstrap();
