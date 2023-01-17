import rateLimit from "express-rate-limit";
import RedisStore from "rate-limit-redis";

export const OpenCallslimiter = (client) => rateLimit({
    windowMs: 1 * 60 * 60 * 1000, // 1 Hour duration in milliseconds
    max: 2,
    message: "You exceeded 2 requests for Notary Session please try after 1 hour!",
    headers: true,
    // Redis store configuration
    store: new RedisStore({
        sendCommand: (...args: string[]) => client.sendCommand(args),
    }),
});
export const GlobalLimit = (client) =>  rateLimit({
    windowMs: 1 * 60 * 1000, // 1 Minute duration in milliseconds
    max: 15,
    message: "You exceeded 15 requests in 1 Minute limit!",
    headers: true,
    // Redis store configuration
    store: new RedisStore({
        sendCommand: (...args: string[]) => client.sendCommand(args),
    }),
});
export const SignupLimit = (client) =>  rateLimit({
    windowMs: 1 * 60 * 60 * 1000, // 1 Hour duration in milliseconds
    max: 3,
    message: "You exceeded 3 requests for Signup please try after 1 hour!",
    headers: true,
    // Redis store configuration
    store: new RedisStore({
        sendCommand: (...args: string[]) => client.sendCommand(args),
    }),
    });
export const LoginLimit = (client) =>  rateLimit({
    
    windowMs: 1 * 60 * 60 * 1000, // 1 Hour duration in milliseconds
    max: 10,
    message: "You exceeded 10 requests for Login please try after 1 hour.",
    headers: true,
    // Redis store configuration
    store: new RedisStore({
        sendCommand: (...args: string[]) => client.sendCommand(args),
    }),
});
export const OpenCallslimiterWitness = (client) => rateLimit({
    windowMs: 1 * 60 * 60 * 1000, // 1 Hour duration in milliseconds
    max: 3,
    message: "You exceeded 3 requests for Witness Notary Session please try after 1 hour!",
    headers: true,
    // Redis store configuration
    store: new RedisStore({
        sendCommand: (...args: string[]) => client.sendCommand(args),
    }),
});
