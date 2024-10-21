import cors from 'cors';
import express from 'express';
import * as http from 'http';
import { AddressInfo } from 'net';
import { Service } from 'typedi';
import { SocketManager } from './socket/socketManager.service';

@Service()
export class Server {
    private static readonly appPort: string | number | boolean = Server.normalizePort(process.env.PORT || '5020');
    private static readonly baseDix: number = 10;
    private server: http.Server;
    private socketManager: SocketManager;
    private app: express.Application;

    constructor() {
        this.app = express();
        this.config();
        this.bindRoutes();

        this.server = http.createServer(this.app);
        this.socketManager = new SocketManager(this.server);
        this.socketManager.handleSockets();
    }

    private static normalizePort(val: number | string): number | string | boolean {
        const port: number = typeof val === 'string' ? parseInt(val, this.baseDix) : val;
        if (isNaN(port)) {
            return val;
        } else if (port >= 0) {
            return port;
        } else {
            return false;
        }
    }

    private config(): void {
        this.app.use(express.json());
        this.app.use(express.urlencoded({ extended: true }));
        this.app.use(cors({ origin: '*' }));
    }

    private bindRoutes(): void {
        this.errorHandling();
    }

    private errorHandling(): void {
        this.app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
            res.status(404).send({ message: 'Not Found' });
            next();
        });

        this.app.use((err: any, req: express.Request, res: express.Response) => {
            const status = err.status || 500;
            res.status(status).send({
                message: err.message,
                error: this.app.get('env') === 'development' ? err : {},
            });
        });
    }

    init(): void {
        this.app.set('port', Server.appPort);

        this.server.listen(Server.appPort);
        this.server.on('error', (error: NodeJS.ErrnoException) => this.onError(error));
        this.server.on('listening', () => this.onListening());
    }

    private onError(error: NodeJS.ErrnoException): void {
        if (error.syscall !== 'listen') {
            throw error;
        }
        const bind: string = typeof Server.appPort === 'string' ? 'Pipe ' + Server.appPort : 'Port ' + Server.appPort;
        switch (error.code) {
            case 'EACCES':
                // eslint-disable-next-line no-console
                console.error(`${bind} requires elevated privileges`);
                process.exit(1);
                break;
            case 'EADDRINUSE':
                // eslint-disable-next-line no-console
                console.error(`${bind} is already in use`);
                process.exit(1);
                break;
            default:
                throw error;
        }
    }

    private onListening(): void {
        const addr = this.server.address() as AddressInfo;
        const bind: string = typeof addr === 'string' ? `pipe ${addr}` : `port ${addr.port}`;
        // eslint-disable-next-line no-console
        console.log(`Listening on ${bind}`);
    }
}
