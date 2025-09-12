const { createClient } =require('redis');

const redisclient = createClient({
    username: 'default',
    password: 'IPi6woeop4gjLdsPeUOBcNiryvizNkha',
    socket: {
        host: 'redis-15739.c8.us-east-1-3.ec2.redns.redis-cloud.com',
        port: 15739
    }});
    module.exports = redisclient;
