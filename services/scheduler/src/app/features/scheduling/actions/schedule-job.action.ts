import { Request, Response, NextFunction } from "express";
import { celebrate, Joi } from "celebrate";
import { CommandBus } from "../../../../../../../shared/command-bus";
import { ScheduleJobCommand } from "../commands/schedule-job.command";
import { CREATED } from "http-status-codes";
import { HttpMethod, JobType } from "../../../../scheduler";

export interface ScheduleJobActionProps {
  commandBus: CommandBus;
}

const cronRegex = new RegExp(
  /^(\*|([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])|\*\/([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])) (\*|([0-9]|1[0-9]|2[0-3])|\*\/([0-9]|1[0-9]|2[0-3])) (\*|([1-9]|1[0-9]|2[0-9]|3[0-1])|\*\/([1-9]|1[0-9]|2[0-9]|3[0-1])) (\*|([1-9]|1[0-2])|\*\/([1-9]|1[0-2])) (\*|([0-6])|\*\/([0-6]))$/,
);

export const scheduleJobActionValidation = celebrate(
  {
    body: Joi.object({
      name: Joi.string().required(),
      type: Joi.string()
        .valid(...Object.values(JobType))
        .required(),
      payload: Joi.object({
        method: Joi.string()
          .valid(...Object.keys(HttpMethod))
          .optional(),
        url: Joi.string().required(),
        headers: Joi.object().pattern(/.*/, [Joi.string()]).optional(),
        body: Joi.object().unknown().optional(),
        options: Joi.object({
          compress: Joi.boolean().optional(),
          follow: Joi.number().min(0).optional(),
          size: Joi.number().min(0).optional(),
          timeout: Joi.number().min(0).optional(),
        }).optional(),
      }).required(),
      jobOptions: Joi.object({
        priority: Joi.number().optional(),
        delay: Joi.number().optional(),
        attempts: Joi.number().optional(),
        cron: Joi.string().regex(cronRegex).optional(),
        cronStartDate: Joi.date().optional(),
        cronEndDate: Joi.date().optional(),
        cronTimeZone: Joi.string().optional(),
        cronLimit: Joi.number().optional(),
        backoff: Joi.number().optional(),
        lifo: Joi.boolean().optional(),
        timeout: Joi.number().optional(),
        removeOnComplete: Joi.boolean().optional(),
        removeOnFail: Joi.boolean().optional(),
        stackTraceLimit: Joi.number().optional(),
      }).optional(),
      startImmediately: Joi.boolean().optional(),
    }).required(),
  },
  { abortEarly: false },
);

/**
 * @swagger
 *
 * /api/scheduling/schedule-job:
 *   post:
 *     tags:
 *       - Scheduling
 *     security: []
 *     summary: Schedule an action to another service - either to run immediately, at some specific timestamp or as a cron job.
 *     description: Schedule an action to another service - either to run immediately, at some specific timestamp or as a cron job.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *          schema:
 *            type: object
 *            properties:
 *              name:
 *                type: string
 *                description: The job name.
 *                required: true
 *              type:
 *                type: string
 *                enum: [http]
 *                description: Job type
 *                required: true
 *              payload:
 *                type: object
 *                required: true
 *                properties:
 *                  method:
 *                    type: string
 *                    enum: [GET, HEAD, POST, PUT, DELETE, CONNECT, OPTIONS, TRACE, PATCH]
 *                    required: false
 *                  url:
 *                    type: string
 *                    description: Request URL string
 *                    example: "http://example.com?foo=bar"
 *                    required: true
 *                  headers:
 *                    type:
 *                      - array
 *                      - object
 *                    required: false
 *                  body:
 *                    type:
 *                      - string
 *                      - object
 *                      - array
 *                    required: false
 *                  options:
 *                    type: object
 *                    required: false
 *                    properties:
 *                      compress:
 *                        type: boolean
 *                        default: true
 *                        description: Support gzip/deflate content encoding. false to disable
 *                        required: false
 *                      follow:
 *                        type: number
 *                        default: 20
 *                        description: Maximum redirect count. 0 to not follow redirect
 *                        required: false
 *                      size:
 *                        type: number
 *                        default: 0
 *                        description: Maximum response body size in bytes. 0 to disable
 *                        required: false
 *                      timeout:
 *                        type: number
 *                        default: 0
 *                        description: Request/response timeout in ms, it resets on redirect. 0 to disable (OS limit applies)
 *                        required: false
 *              jobOptions:
 *                type: object
 *                example: { "cron":"0 22 * * 1"}
 *                properties:
 *                  priority:
 *                    type: number
 *                    description: Optional priority value. ranges from 1 (highest priority) to MAX_INT  (lowest priority). Note that using priorities has a slight impact on performance, so do not use it if not required.
 *                    required: false
 *                  delay:
 *                    type: number
 *                    description: An amount of milliseconds to wait until this job can be processed. Note that for accurate delays, both server and clients should have their clocks synchronized.
 *                    required: false
 *                  attempts:
 *                    type: number
 *                    description: The total number of attempts to try the job until it completes.
 *                    required: false
 *                    default: 3
 *                  cron:
 *                    type: string
 *                    description: Repeat job according to a cron specification.
 *                    required: false
 *                  cronStartDate:
 *                    type: string
 *                    description: Start date when the repeat job should start repeating.
 *                    required: false
 *                    example: '2020-01-01 10:00:00'
 *                  cronEndDate:
 *                    type: string
 *                    description: End date when the repeat job should stop repeating.
 *                    required: false
 *                    example: '2020-01-02 15:30:00'
 *                  cronTimeZone:
 *                    type: string
 *                    description: Cron Timezone.
 *                    required: false
 *                  cronLimit:
 *                    type: number
 *                    description: Number of times the job should repeat at max.
 *                    required: false
 *                  backoff:
 *                    type: number
 *                    description: Setting for automatic retries if the job fails.
 *                    required: false
 *                    default: 5000
 *                  lifo:
 *                    type: boolean
 *                    description: If true, adds the job to the right of the queue instead of the left.
 *                    required: false
 *                    default: false
 *                  timeout:
 *                    type: number
 *                    description: The number of milliseconds after which the job should be fail with a timeout error.
 *                    required: false
 *                  removeOnComplete:
 *                    type: boolean
 *                    description: If true, removes the job when it successfully completes.
 *                    required: false
 *                  removeOnFail:
 *                    type: boolean
 *                    description: If true, removes the job when it fails after all attempts..
 *                    required: false
 *                  stackTraceLimit:
 *                    type: number
 *                    description: Limits the amount of stack trace lines that will be recorded in the stacktrace.
 *                    required: false
 *              startImmediately:
 *                type: boolean
 *                default: true
 *                required: false
 *     responses:
 *       201:
 *         description: Job scheduled
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *       400:
 *         description: Bad Request
 *         content:
 *           application/json:
 *             schema:
 *               $ref:  "#/definitions/BadRequestError"
 *       409:
 *         description: Already Exists
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                error:
 *                  type: string
 *                  example: Job with name example-job already exists
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               $ref:  "#/definitions/InternalServerError"
 */
export const scheduleJobAction = ({ commandBus }: ScheduleJobActionProps) => (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  commandBus
    .execute(
      new ScheduleJobCommand({
        name: req.body.name,
        type: req.body.type,
        payload: req.body.payload,
        jobOptions: req.body.jobOptions,
        startImmediately: req.body.startImmediately ?? true,
      }),
    )
    .then((commandResult) => {
      res.status(CREATED).json(commandResult);
    })
    .catch(next);
};
