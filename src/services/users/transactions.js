import borrowerModels from '../../database/models/borrower/borrower.models.js';
import autoLendModels from '../../database/models/loan/autoLend.models.js';
// import { dateFormatter, getCurrentJakartaTime } from '../../utils/index.js';

// const compareDate = () => {
//     const dueDate = new Date(loanDueDate);
//     const currentDate = new Date();
//     // if ()
//     let statusPayment = '';

//     if (
//         dueDate.getFullYear === currentDate.getFullYear &&
//         dueDate.getMonth === currentDate.getMonth &&
//         dueDate.getDate === currentDate.getDate
//     ) {
//         statusPayment = '';
//     } else {
//         statusPayment = '';
//     }

//     return statusPayment;
// };

export const updateAutoLendIfAny = async (userId) => {
    try {
        await autoLendModels.findOneAndUpdate(
            {
                userId,
                status: 'matched',
            },
            {
                $set: {
                    status: 'done',
                },
            },
        );
    } catch (error) {
        throw error;
    }
};

export const updateBorrowerPerformance = async (
    userId,
    loanAmount,
    loanDueDate,
    isLate,
) => {
    try {
        const borrower = await borrowerModels.findOne({ userId });
        const dueDate = new Date(loanDueDate);
        const currentDate = new Date();

        borrower.performance.borrowingRecord.borrowedFund +=
            parseInt(loanAmount);
        borrower.performance.borrowingRecord.totalBorrowing += 1;

        if (isLate) {
            borrower.performance.repayment.late += 1;
            return await borrower.save();
        }
        // console.log('currentDate', currentDate);
        // console.log('dueDate', dueDate);
        if (
            dueDate.getFullYear() === currentDate.getFullYear() &&
            dueDate.getMonth() === currentDate.getMonth() &&
            dueDate.getDate() === currentDate.getDate()
        ) {
            borrower.performance.repayment.onTime += 1;
            return await borrower.save();
        }

        borrower.performance.repayment.earlier += 1;
        return await borrower.save();
    } catch (error) {
        console.log('error at update performance');
        throw error;
    }
};
