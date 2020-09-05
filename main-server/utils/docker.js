const Docker = require('dockerode');
const logger = require('./logger');

createRoom = async (image, roomId, memLimit, cpuLimit, host, network) => {
    const docker = new Docker({ socketPath: process.env.DOCKER_SOCKET });
    let auxContainer;
    let res = {};
    logger.info(`creating docker container for room ${roomId} from image ${image}`)
    await docker.createContainer({
        Image: image,
        name: roomId,
        AttachStdin: false,
        AttachStdout: true,
        AttachStderr: true,
        Labels: {
            [`traefik.http.routers.${roomId}.rule`]: "Host(`" + host + "`) && PathPrefix(`/" + roomId + "`)",
            [`traefik.http.middlewares.${roomId}-stripprefix.stripprefix.prefixes`]: "/" + roomId,
            [`traefik.http.middlewares.${roomId}-auth.forwardauth.address`]: `http://localhost/auth`,
            [`traefik.http.routers.${roomId}.middlewares`]: `${roomId}-stripprefix, ${roomId}-auth`,
            [`traefik.http.middlewares.${roomId}-auth.forwardauth.authResponseHeaders`]:"X-Forwarded-URI",
            [`traefik.http.middlewares.${roomId}-auth.forwardauth.trustForwardHeader`]:"true"      
        },
        Tty: true,
        OpenStdin: false,
        StdinOnce: false,
        NetworkingConfig: {
            EndpointsConfig: {
                [network]: {}
            }
        }
    }).then(function (container) {
        logger.info(`starting docker container for room ${roomId} from image ${image}`)
        auxContainer = container;
        return auxContainer.start();
    }).then(function () {
        logger.info(`started docker container for room ${roomId} from image ${image}`)
        res = {
            "status": "created",
            "roomURL": `http://${host}/${roomId}`
        }
    }).catch(function (err) {
        logger.error(`error occurred while creating for room ${roomId} from image ${image} ${err}`)
        res = {
            "status": "error"
        }
    });

    return res
}

// createRoom('pratik', 'cvbn', '', '', 'localhost', 'executeit')

exports.createRoom = createRoom

