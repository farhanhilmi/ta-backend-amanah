import mongoose from 'mongoose';
import { toObjectId } from '../../utils/index.js';
const objectId = mongoose.Types.ObjectId;

export default [
    {
        _id: new objectId('648809d90e51f774902f1663'),
        userId: new objectId('64881019cf0c2cf9d2a00098'),
        profilePicture: null,
        status: 'verified',
        createdDate: '2023-06-13T06:16:23.573+00:00',
        modifyDate: '2023-06-13T06:16:23.573+00:00',
    },
    {
        _id: toObjectId('64880db2cf0c2cf9d2a0006a'),
        userId: '64880da9cf0c2cf9d2a00060',
        profilePicture: null,
        status: 'verified',
        createdDate: '2023-06-13T06:16:23.573+00:00',
        modifyDate: '2023-06-13T06:16:23.573+00:00',
    },
];
