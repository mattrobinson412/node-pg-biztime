/** Routes about companies. */

const slugify = require('slugify')
const express = require("express");
const router = new express.Router();
const db = require("../db");
const ExpressError = require("../expressError");

// RESTFUL routes ################################################### //

// GET routes //
router.get("/", async (req, res, next) => {
    try {
        const comQuery = await db.query("SELECT code, name FROM companies")
        return res.json({ companies: comQuery.rows });

    } catch (err) {
        return next(err);
    }
});

router.get("/:code", async (req, res, next) => {
    try {
        let code = req.params.code;
    
        const compResult = await db.query(
              `SELECT code, name, description
               FROM companies
               WHERE code = $1`,
            [code]
        );
    
        const invResult = await db.query(
              `SELECT id
               FROM invoices
               WHERE comp_code = $1`,
            [code]
        );
    
        if (compResult.rows.length === 0) {
          throw new ExpressError(`No such company: ${code}`, 404)
        }
    
        const company = compResult.rows[0];
        const invoices = invResult.rows;
    
        company.invoices = invoices.map(inv => inv.id);
    
        return res.json({"company": company});

      }
      catch (err) {
        return next(err);
      }
    });


// POST routes //
router.post("/", async (req, res, next) => {
    try {
        let {name, description} = req.body;
        let code = slugify(name, {lower: true});
    
        const result = await db.query(
              `INSERT INTO companies (code, name, description) 
               VALUES ($1, $2, $3) 
               RETURNING code, name, description`,
            [code, name, description]);
    
        return res.status(201).json({"company": result.rows[0]});
      }
    
      catch (err) {
        return next(err);
      }
    });


// PUT routes //
router.put("/:code", async (req, res, next) => {
    try {
        let {name, description} = req.body;
        let code = req.params.code;

        const result = await db.query(
            `UPDATE companies
                SET name = $1
                WHERE code = $2
                RETURNING code, name, description`,
            [name, description, code]);
        
        if (result.rows.length === 0) {
            throw new ExpressError(`There is no company with code of ${code}`, 404);
        } else {
            return res.json({ company: result.rows[0] });
        }

    } catch (err) {
        return next(err);
    }
});


// DELETE routes //
router.delete("/:code", async (req, res, next) => {
    try {
        const result = await db.query(
            "DELETE FROM companies WHERE code = $1 RETURNING code", [req.params.id]);

        if (result.rows.length === 0) {
            throw new ExpressError(`There is no company code of ${req.params.id}`, 404);
        }

        return res.json({ message: "Company deleted" });

    } catch (err) {
        return next(err);
    }
});


module.exports = comRoutes;