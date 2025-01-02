const express = require('express');
const mongoose = require('mongoose');
const app = express();
const PORT = 3000;

app.use(express.json());

const dbURI = 'mongodb+srv://root:root@maitri.mrckj.mongodb.net/Test?retryWrites=true&w=majority&appName=Maitri';

mongoose.connect(dbURI)
  .then(() => console.log('Connected to MongoDB Atlas'))
  .catch(err => {
    console.error('Error connecting to MongoDB Atlas:', err.message);
    process.exit(1);
  });

const pincodeSchema = new mongoose.Schema({
  pincode: { type: String, required: true, unique: true },
  details: [
    {
      name: { type: String, required: true },
      position: { type: String, required: true },
      email: {
        type: String,
        required: true,
        unique: true,
        match: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
      },
      contactNumber: {
        type: String,
        required: true,
        match: /^[0-9]{10}$/,
      },
    },
  ],
});

const Pincode = mongoose.model('Pincode', pincodeSchema);

app.get('/findByPincode/:pincode', async (req, res) => {
  try {
    const pincodeData = await Pincode.findOne({ pincode: req.params.pincode });
    if (!pincodeData) {
      return res.status(404).json({ message: 'Pincode not found' });
    }
    res.status(200).json(pincodeData);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching pincode data', error: err.message });
  }
});

app.put('/updateDetails', async (req, res) => {
  const { pincode, name, updatedDetails } = req.body;

  if (!updatedDetails?.email && !updatedDetails?.contactNumber) {
    return res.status(400).json({ message: 'Provide email or contact number to update.' });
  }

  try {
    const pincodeData = await Pincode.findOne({ pincode });
    if (!pincodeData) return res.status(404).json({ message: 'Pincode not found' });

    const person = pincodeData.details.find(person => person.name === name);
    if (!person) return res.status(404).json({ message: 'Person not found' });

    if (updatedDetails.email) person.email = updatedDetails.email;
    if (updatedDetails.contactNumber) person.contactNumber = updatedDetails.contactNumber;

    await pincodeData.save();
    res.status(200).json({ message: 'Details updated successfully', pincodeData });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: 'Email or contact number must be unique.' });
    }
    res.status(500).json({ message: 'Error updating details', error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

