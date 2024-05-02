const cron = require("node-cron");
const noteModel = require("../models/noteModel");

function cleanUpBin() {
  cron.schedule("* * 0 * * *", async () => {
    try {
      const deletedNotes = await noteModel.find({ isDeleted: true });
      if(deletedNotes.length > 0){
        const deletedNoteIds = [];
        deletedNotes.map(note =>{
            const diff = (Date.now() - note.deletedAt) / (1000 * 60 * 60 * 24);
            if(diff > 30){
                deletedNoteIds.push(note._id);
            }
        })
        if(deletedNoteIds.length > 0){
            try{
                const deletedNote = await noteModel.findOneAndDelete({_id : {$in : deletedNoteIds}});
            }
            catch(error){
                console.log(error);
            }
        }
      }
      else{
        console.log("No deleted notes");
      }
    } catch (error) {
      console.log(error);
    }
  });
}

module.exports = { cleanUpBin };
