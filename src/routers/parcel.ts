import { Router } from "express";
import { IndexerContext } from "../context";
import * as Exception from "../exception";

/**
 * @swagger
 * tags:
 *   name: Parcel
 *   description: Parcel management
 * definitions:
 *   Parcel:
 *     type: object
 *     required:
 *       - content
 *     properties:
 *       _id:
 *         type: string
 *         description: ObjectID
 *       content:
 *         type: string
 *         description: parcel example
 */
export function handle(_C: IndexerContext, router: Router) {
    /**
     * @swagger
     * /parcels:
     *   get:
     *     summary: Returns parcels
     *     tags: [Parcel]
     *     responses:
     *       200:
     *         description: latest parcels
     *         schema:
     *           type: array
     *           items:
     *             $ref: '#/definitions/Parcel'
     */
    router.get("/parcels", async (_A, _B, next) => {
        try {
            throw Exception.NotImplmeneted;
        } catch (e) {
            next(e);
        }
    });

    /**
     * @swagger
     * /parcels/count:
     *   get:
     *     summary: Returns count of parcels
     *     tags: [Parcel]
     *     responses:
     *       200:
     *         description: count of parcels
     *         schema:
     *           type: number
     *           example: 12
     */
    router.get("/parcels/count", async (_A, _B, next) => {
        try {
            throw Exception.NotImplmeneted;
        } catch (e) {
            next(e);
        }
    });

    /**
     * @swagger
     * /parcels:
     *   get:
     *     summary: Returns a specific parcel
     *     tags: [Parcel]
     *     responses:
     *       200:
     *         description: pecific parcel
     *         schema:
     *           type: object
     *           $ref: '#/definitions/Parcel'
     */
    router.get("/parcel/:hash", async (_A, _B, next) => {
        try {
            throw Exception.NotImplmeneted;
        } catch (e) {
            next(e);
        }
    });
}
