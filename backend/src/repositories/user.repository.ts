import User from "../models/user.model";
import { IUser } from "../interfaces/user.interface";
import { UserRole } from "../interfaces/enums";
import Question from '../models/question.model'
import mongoose from "mongoose";

export default class UserRepository {
  async create(userData: Partial<IUser>): Promise<IUser> {
    return User.create(userData);
  }

  async findByEmail(email: string): Promise<IUser | null> {
    return User.findOne({ email });
  }
  async updateUserState(id: string,locationDetails:any): Promise<IUser | null> {
   // console.log("location details===",locationDetails)
    //return null
  const  longitude=locationDetails.location.coordinates[0]
  const  latitude=locationDetails.location.coordinates[1]
    return await User.findByIdAndUpdate(
      id,
      {
        state:locationDetails.state,
        location: { type: 'Point', coordinates: [longitude, latitude] }
      },
      { new: true }
    );
  }

  async findById(id: string): Promise<IUser | null> {
    return User.findById(id);
  }

  async findAll(
    skip: number = 0,
    limit: number = 100,
    role?: UserRole | "all",
    search?: string
  ): Promise<IUser[]> {
    const query: any = { role: { $ne: "admin" } };

    if (role && role !== "all") {
      query.role = role;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    return await User.find(query)
      .skip(skip)
      .limit(limit)
      .select("-hashed_password");
  }

  async count(role?: UserRole | "all", search?: string): Promise<number> {
    const query: any = { role: { $ne: "admin" } };

    if (role && role !== "all") {
      query.role = role;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    return await User.countDocuments(query);
  }

  async updateStatus(
    userId: string,
    isActive: boolean,
    isAvailable?: boolean
  ): Promise<IUser | null> {
    const update: Partial<IUser> = { is_active: isActive };
    if (isAvailable !== undefined) update["is_available"] = isAvailable;
    return User.findByIdAndUpdate(userId, update, { new: true });
  }
  async updateDetails(
    userId: string,
    role : string,
    specializationField: string
  ): Promise<IUser | null> {
    if(role==='agri_specialist')
    {
    
      const update: Partial<IUser> = { role: UserRole.AGRI_SPECIALIST};
    if (specializationField !== undefined) update["specializationField"] = specializationField;
    return User.findByIdAndUpdate(userId, update, { new: true });
    }
    else{
     
      const update: Partial<IUser> = { role: UserRole.MODERATOR};
      if (specializationField !== undefined) update["specializationField"] = specializationField;
      return User.findByIdAndUpdate(userId, update, { new: true });
    }
    
    
  }
  async deleteUser(
    userId: string,
   
  ): Promise<IUser | null> {
    
      const deleteUser=await  User.findByIdAndDelete(userId);
     // console.log("the deleteUser====",deleteUser)
      return deleteUser
     
    
    
  }

  async getAvailableSpecialists(currentUserObj?: any,questionObj?: any,answerData?: any): Promise<IUser[]> {
  //console.log("the questionObject===",questionObj)
const results= this.getAvailableUserList(currentUserObj,questionObj,UserRole.AGRI_SPECIALIST)
  return results
    
  }

  async getAvailableModerators(currentUserObj?: any,questionObj?: any): Promise<IUser[]> {
    const results= this.getAvailableUserList(currentUserObj,questionObj,UserRole.MODERATOR)
    return results
  }
    
    


  
    async updateWorkload(userId: string, increment: number): Promise<void> {
      if (increment < 0) {
        // Only decrement if workload_count > 0
        await User.updateOne(
          { _id: userId, workload_count: { $gt: 0 } },
          { $inc: { workload_count: increment } }
        );
      } else {
        // Increment normally
        await User.updateOne(
          { _id: userId },
          { $inc: { workload_count: increment } }
        );
      }
    }
  

  async updateIncentive(userId: string, increment: number): Promise<void> {
    await User.findByIdAndUpdate(userId, {
      $inc: { incentive_points: increment },
    });
  }
  async updatePenality(userId: string, increment: number): Promise<void> {
    await User.findByIdAndUpdate(userId, {
      $inc: { penality: increment },
    });
  }
  async getAvailableUserList(currentUserObj?: any,questionObj?: any,type?:string): Promise<IUser[]>{
    let reviewed_by_specialist_array= []
    if(currentUserObj &&questionObj )
    {
    
     const result= await Question.find({question_id:questionObj.question_id} )
    let questionOwner=currentUserObj._id.toString()
    let arr=result[0]?.reviewed_by_specialists|| []
   const userIdStr = result[0]?.user_id;
 
 if (!userIdStr || !mongoose.Types.ObjectId.isValid(userIdStr)) {
   throw new Error("Invalid or missing user_id");
 }
 const convertUserid = mongoose.Types.ObjectId.createFromHexString(userIdStr)

   let actualOwner=convertUserid
   let assigned_specialist_id=result[0]?.assigned_specialist_id?.toString() 
   for await (const value of arr) {
     reviewed_by_specialist_array.push(value);
   }
   
   const totalReviewedUserList=[...reviewed_by_specialist_array,actualOwner] 
 
 
   const currentUserfromDatabase=await User.findOne({_id:currentUserObj})
   
   if(currentUserfromDatabase?.location)
   {
     const latitude=currentUserfromDatabase.location.coordinates[0]
     const longitude=currentUserfromDatabase.location.coordinates[1]
     const nearestUser = await User.aggregate([
       {
         $geoNear: {
           near: { type: "Point", coordinates: [latitude,longitude] },
           distanceField: "dist.calculated",
            spherical: true,
         },
       },
       {
         $match: { 
          _id: { $nin: totalReviewedUserList },
       //  specializationField:questionObj.query_type,
         role: type,
         is_active: true,
         is_available: true } // filter by username
       },
       {
         $sort: { workload_count: 1, "dist.calculated": 1 },
       },
      
     ]);
    if(nearestUser)
    {
      return nearestUser
    }
    else{
      return User.find({
        role: type,
        is_active: true,
        is_available: true,
      }).sort({ workload_count: 1 });
    }
   
   }
   else{
     let userList= await User.find({
       _id: { $nin: totalReviewedUserList },
       role: type,
       is_active: true,
       is_available: true,
     }).sort({ workload_count: 1 });
         return userList
 
   }
   }
    else{
     return User.find({
       role: type,
       is_active: true,
       is_available: true,
     }).sort({ workload_count: 1 });
    
    }
  }

  
 
  async getAllUsersList(currentUserId:string): Promise<any> {
   
  const result=  await User.aggregate([
      // 1. Rank all users by incentive_points (descending)
      {
        $setWindowFields: {
          sortBy: { incentive_points: -1 },
          output: {
            rank: { $rank: {} }
          }
        }
      },
    
      // 2. Match the specific user
      {
        $match: {
          _id:  mongoose.Types.ObjectId.createFromHexString(currentUserId)
        }
      },
    
      // 3. Count total users (via a lookup)
      {
        $lookup: {
          from: "users",
          pipeline: [
            { $match: {} },
            { $count: "totalUsers" }
          ],
          as: "userCount"
        }
      },
    
      // 4. Flatten total user count
      {
        $addFields: {
          totalUsers: { $ifNull: [{ $arrayElemAt: ["$userCount.totalUsers", 0] }, 0] }
        }
      },
    
      // 5. Project final output
      {
        $project: {
          _id: 1,
          name: 1,
          email: 1,
          incentive_points: 1,
          rank: 1,
          totalUsers: 1
        }
      }
    ]);
    return result
   
  }
    
}
