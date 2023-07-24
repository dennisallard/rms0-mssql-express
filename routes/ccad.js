import express from 'express';
import { poolPromiseCCAD, sql } from '../db.js';

const router = express.Router();

// NOT YET IMPLEMENTED - The code below is boilerplate and WILL NOT WORK
router.get('/', async (req, res) => {
  const { parm1, parm2, parm3 } = req.query;

  try {
    const pool = await poolPromiseCCAD;

    const request = pool.request();
    request.input('parm1', sql.VarChar, parm1);
    request.input('parm2', sql.VarChar, parm2);
    request.input('parm3', sql.VarChar, parm3);
    request.query('SELECT * FROM ccad WHERE parm1 = @parm1 AND parm2 = @parm2 AND parm3 = @parm3');

    let result = [];

    request.on('recordset', (columns) => {
      // Recordset metadata received
    });

    request.on('row', (row) => {
      // Rows received
      result.push(row);
    });

    request.on('error', (error) => {
      console.error('Error executing SQL query:', error);
      res.status(500).json({ error: 'Internal server error' });
    });

    request.on('done', (affectedRows) => {
      // All rows have been received
      res.json(result);
    });
  } catch (error) {
    console.error('Error executing SQL query:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
