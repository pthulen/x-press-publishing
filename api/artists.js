const express = require('express');
const artistsRouter = express.Router();
const sqlite3 = require('sqlite3');



//loads database and uses Test Database during tests rather than working database
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

//GET all handler for current employees
artistsRouter.get('/', (req, res, next) => {
    db.all('SELECT * FROM Artist WHERE is_currently_employed = 1', (err, artists) => {
      if (err) {
        next(err);
      } else {
        res.status(200).json({artists: artists});
      }
    });
  });

  //parameter handler for all request using artistId
  artistsRouter.param('artistId', (req, res, next, artistId) => {
    db.get("SELECT * FROM Artist WHERE Artist.id = $artistId", 
    {
      $artistId: artistId  
    }, (err, artist) => {
        if(err) {
            next(err);
        } else if (artist) {
                req.artist = artist;
                next();
            } else {
                res.status(404);
                
            }
    })
  });

  //Handles GET requests by artistId
artistsRouter.get('/:artistId',(req,res, next) => {
    res.status(200).json({artist: req.artist});
})

//Handles POST request 
artistsRouter.post('/', (req, res, next) => {
    //checks if the req is valid
    const name = req.body.artist.name;
    const dateOfBirth =req.body.artist.dateOfBirth;
    const biography = req.body.artist.biography
    const isCurrentlyEmployed = req.body.artist.isCurrentlyEmployed === 0 ? 0 : 1;
    if(!name || !dateOfBirth || !biography) {
        return res.sendStatus(400);
    }

    const sql = `INSERT INTO Artist (name, date_of_birth, biography, is_currently_employed) 
    VALUES ($name, $dateOfBirth, $biography, $isCurrentlyEmployed)`;
    const values = {
        $name: name,
        $dateOfBirth: dateOfBirth,
        $biography: biography,
        $isCurrentlyEmployed: isCurrentlyEmployed
    }

    db.run(sql, values, function(err) {
        if(err) {
            next(err);
        } else {
        db.get("SELECT * FROM Artist WHERE Artist.id = $lastID", 
        {
            $lastID: this.lastID
        }, (err, artist) => {
            res.status(201).json({artist: artist});
        })
    }
    }) 
})

//handles PUT requests
artistsRouter.put('/:artistId', (req, res, next) => {
    //checks if the req is valid
    const name = req.body.artist.name;
    const dateOfBirth =req.body.artist.dateOfBirth;
    const biography = req.body.artist.biography
    const isCurrentlyEmployed = req.body.artist.isCurrentlyEmployed === 0 ? 0 : 1;
    if(!name || !dateOfBirth || !biography || !isCurrentlyEmployed) {
        return res.sendStatus(400);
    }

    //query string
    const sql = 'UPDATE Artist SET name = $name, date_of_birth = $dateOfBirth, biography = $biography, is_currently_employed = $isCurrentlyEmployed WHERE Artist.id = $artistId';
    //values in string from PUT request
    const values = {
    $name: name,
    $dateOfBirth: dateOfBirth,
    $biography: biography,
    $isCurrentlyEmployed: isCurrentlyEmployed,
    $artistId: req.params.artistId
    };

    db.run(sql, values, (error) => {
        if(error) {
            next(error);
        } else {
        db.get("SELECT * FROM Artist WHERE Artist.id = $artistId", 
        {
            $artistId: req.params.artistId
        }, (error, artist) => {
            res.status(200).json({artist: artist});
        })
    }
    });
})

artistsRouter.delete('/:artistId', (req, res, next) => {
    const artistId = req.params.artistId;
    const isCurrentlyEmployed = 0;
    const sql = 'UPDATE Artist SET is_currently_employed = $isCurrentlyEmployed WHERE Artist.id = $artistId';
    const values = {
        $isCurrentlyEmployed: isCurrentlyEmployed,
        $artistId: artistId
    };

    db.run(sql, values, (error) => {
        if(error) {
            next(error);
        } else {
            db.get("SELECT * FROM Artist WHERE Artist.id = $artistId", 
            {
                $artistId: req.params.artistId
            }, (error, artist) => {
                res.status(200).json({artist: artist});
            })
    }
    });
}); 

  module.exports = artistsRouter;