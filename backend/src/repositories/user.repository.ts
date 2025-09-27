import User from "../models/user.model";
import { IUser } from "../interfaces/user.interface";
import { UserRole } from "../interfaces/enums";
import Question from '../models/question.model'

export default class UserRepository {
  async create(userData: Partial<IUser>): Promise<IUser> {
    return User.create(userData);
  }

  async findByEmail(email: string): Promise<IUser | null> {
    return User.findOne({ email });
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

  async getAvailableSpecialists(currentUserObj?: any,questionObj?: any,answerData?: any): Promise<IUser[]> {
  /*  if(answerData && answerData.status=='Rejected')
    {
      const rejectedUser= await User.find({
        _id:answerData.RejectedUser,
        role: UserRole.AGRI_SPECIALIST,
        is_active: true,
        is_available: true,
      }).sort({ workload_count: 1 });
        return rejectedUser
    }*/
   if(currentUserObj &&questionObj )
   {
   
    const result= await Question.find({question_id:questionObj.question_id} )
   let questionOwner=currentUserObj._id.toString()
  
  let reviewed_by_specialist_array= []
  reviewed_by_specialist_array.push(questionOwner)
  let arr=result[0]?.reviewed_by_specialists|| []
  let actualOwner=result[0]?.user_id
  let assigned_specialist_id=result[0]?.assigned_specialist_id?.toString() 
  for await (const value of arr) {
    reviewed_by_specialist_array.push(value.toString());
  }
  
  const totalReviewedUserList=[...reviewed_by_specialist_array,assigned_specialist_id,actualOwner] 

  let userList= await User.find({
    _id: { $nin: totalReviewedUserList },
    role: UserRole.AGRI_SPECIALIST,
    is_active: true,
    is_available: true,
  }).sort({ workload_count: 1 });
      return userList
     
   }
   else{
    return User.find({
      role: UserRole.AGRI_SPECIALIST,
      is_active: true,
      is_available: true,
    }).sort({ workload_count: 1 });
   
   }
    
  }

  async getAvailableModerators(currentUserObj?: any,questionObj?: any): Promise<IUser[]> {
    if(currentUserObj &&questionObj )
    {
    
     const result= await Question.find({question_id:questionObj.question_id})
    
   
   let reviewed_by_specialist_array= []
   let arr=result[0]?.reviewed_by_specialists|| []
   let assigned_specialist_id=result[0]?.assigned_specialist_id?.toString() 
   for await (const value of arr) {
     reviewed_by_specialist_array.push(value.toString());
   }
   const totalReviewedUserList=[...reviewed_by_specialist_array,assigned_specialist_id] 
       return User.find({
         _id: { $nin: totalReviewedUserList },
         role: UserRole.MODERATOR,
         is_active: true,
         is_available: true,
       }).sort({ workload_count: 1 });
      
    }
    else{
     return User.find({
       role: UserRole.MODERATOR,
       is_active: true,
       is_available: true,
     }).sort({ workload_count: 1 });
    
    }
    
    
  }

  async updateWorkload(userId: string, increment: number): Promise<void> {
    await User.findByIdAndUpdate(userId, {
      $inc: { workload_count: increment },
    });
  }

  async updateIncentive(userId: string, increment: number): Promise<void> {
    await User.findByIdAndUpdate(userId, {
      $inc: { incentive_points: increment },
    });
  }
}
