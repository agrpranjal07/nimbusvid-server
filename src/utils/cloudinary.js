import {v2 as cloudinary} from "cloudinary"
import fs from "fs"
import { ApiError } from "./ApiError.js";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUND_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
})

const uploadOnCloudinary = async (localFilePath)=> {
    try{
        if(!localFilePath) {
            console.log("Could not find the path");
            return null;
        }
        //upload the file on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath,{
            resource_type: "auto"
        })
        // file has been uploaded successfull

        // console.log("file is uploaded on cloudinary",response.url);
        fs.unlinkSync(localFilePath)
        return response;
    }catch(error){
        console.log('Error in uploading image on clodinary', error);
        fs.unlinkSync(localFilePath) //It will remove the locallly saved temp file as the operation fails
        return null;

    }
}

const deleteOnCloudinary = async (url)=> {
    try{
        if(!url) {
            console.log("Could not find the old Image");
            return null;
        }

        //delete the file on cloudinary
        await cloudinary.uploader.destroy(url.split('/').pop().split('.')[0], (error) => {
            if (error) {
              throw new ApiError(402, error,'Image Not Found');
                }
            }
          );

    }
    catch(error){
        console.log('Error in deleting image on clodinary', error);
        
        return null;

    }
}

export { uploadOnCloudinary,deleteOnCloudinary } 

