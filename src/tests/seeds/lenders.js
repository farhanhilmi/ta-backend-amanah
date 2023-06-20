import mongoose from 'mongoose';
const objectId = mongoose.Types.ObjectId;

export default [
    {
        _id: new objectId('648809d90e51f774902f1663'),
        userId: new objectId('6445ffa60cfd73ccc903960c'),
        profilePicture: null,
        status: 'verified',
        createdDate: {
            $date: {
                $numberLong: '1686637017521',
            },
        },
        modifyDate: {
            $date: {
                $numberLong: '1686637601403',
            },
        },
        __v: 0,
    },
];
