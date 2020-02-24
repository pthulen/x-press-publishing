const express = require('express');
const seriesRouter = express.Router();
const sqlite3 = require('sqlite3');

//loads database and uses Test Database during tests rather than working database
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

const issuesRouter = require('./issues');

//GET all handler for series request
seriesRouter.get('/', (req, res, next) => {
    db.all('SELECT * FROM Series', (err, series) => {
      if (err) {
        next(err);
      } else {
        res.status(200).json({series: series});
      }
    });
  });

//parameter handler for all request using seriesId
seriesRouter.param('seriesId', (req, res, next, seriesId) => {
db.get("SELECT * FROM Series WHERE Series.id = $seriesId", 
{
    $seriesId: seriesId  
}, (err, series) => {
    if(err) {
        next(err);
    } else if (series) {
            req.series = series;
            next();
        } else {
            res.status(404);
            
        }
})
});

seriesRouter.use('/:seriesId/issues', issuesRouter);
//Handles individual GET requests

seriesRouter.get('/:seriesId', (req, res, next) =>{
        res.status(200).json({series: req.series});
  })

//Handles POST requests
seriesRouter.post('/', (req, res, next) => {
    //checks if the req is valid
    const name = req.body.series.name;
    const description =req.body.series.description;
    if(!name || !description) {
        return res.sendStatus(400);
    }

    const sql = `INSERT INTO Series (name, description) 
    VALUES ($name, $description)`;
    const values = {
        $name: name,
        $description: description,
    }

    db.run(sql, values, function(err) {
        if(err) {
            next(err);
        } else {
        db.get("SELECT * FROM Series WHERE Series.id = $lastID", 
        {
            $lastID: this.lastID
        }, (err, series) => {
            res.status(201).json({series: series});
        })
    }
    }) 
})

// Handles all PUT requests
seriesRouter.put('/:seriesId', (req, res, next) => {
    //checks if the req is valid
    const name = req.body.series.name;
    const description =req.body.series.description;
    if(!name || !description) {
        return res.sendStatus(400);
    }

    //query string
    const sql = 'UPDATE Series SET name = $name, description = $description WHERE Series.id = $seriesId';
    //values in string from PUT request
    const values = {
    $name: name,
    $description: description,
    $seriesId: req.params.seriesId
    };

    db.run(sql, values, (error) => {
        if(error) {
            next(error);
        } else {
        db.get("SELECT * FROM Series WHERE Series.id = $seriesId", 
        {
            $seriesId: req.params.seriesId
        }, (error, series) => {
            res.status(200).json({series: series});
        })
    }
    });
});

seriesRouter.delete('/:seriesId', (req, res, next) => {
    const issueSql = 'SELECT * FROM Issue WHERE Issue.series_id = $seriesId';
    const issueValues = {$seriesId: req.params.seriesId};
    db.get(issueSql, issueValues, (error, issue) => {
        if(error) {
            next(error)
        } else if (issue) {
            res.sendStatus(400)
        } else {
            const deleteSql = 'DELETE FROM Series WHERE Series.id = $seriesId';
            const deleteValues = {$seriesId: req.params.seriesId};

            db.run(deleteSql,deleteValues, (error) => {
                if(error) {
                    next(error);
                } else {
                    res.sendStatus(204);
                }
            });
        }
    });
});

module.exports = seriesRouter;