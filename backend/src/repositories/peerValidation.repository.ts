import PeerValidation from '../models/peerValidation.model';
import { IPeerValidation } from '../interfaces/peerValidation.interface';
import answerModel from '../models/answer.model';

export default class PeerValidationRepository {
  async create(peerValidationData: Partial<IPeerValidation>): Promise<IPeerValidation> {
    return PeerValidation.create(peerValidationData);
  }

  async findByPeerValidationId(peerValidationId: string): Promise<IPeerValidation | null> {
    return PeerValidation.findOne({ peer_validation_id: peerValidationId }).populate('answer reviewer');
  }
  
  // async findByAnswerId(answerId: string): Promise<IPeerValidation[]> {
  //   return PeerValidation.find({ answer_id: answerId }).populate('answer reviewer').sort({ created_at: -1 });
  // }

  async findByAnswerId(answerId: string): Promise<IPeerValidation[]> {
    let answerObjectId = answerId;
    if (!/^[0-9a-fA-F]{24}$/.test(answerId)) {
      const answer = await answerModel.findOne({ answer_id: answerId });
      if (!answer) throw new Error(`Answer with id ${answerId} not found`);
      answerObjectId = answer._id.toString();
    }
    return PeerValidation.find({ answer_id: answerObjectId })
      .populate('answer_id reviewer_id')
      .sort({ created_at: -1 });
  }

  async findLastByAnswerId(answerId: string): Promise<IPeerValidation | null> {
    return PeerValidation.findOne({ answer_id: answerId }).sort({ created_at: -1 }).populate('answer reviewer');
  }
}