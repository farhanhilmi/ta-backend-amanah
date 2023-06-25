import config from '../config/index.js';

export const formatData = (data) => {
    return data.map((item) => {
        return {
            id: item._id,
            name: item.name,
            email: item.email,
            role: item.role,
        };
    });
};

export const responseData = (
    data = [],
    status = true,
    message = 'success',
    meta = {},
) => {
    return {
        success: status,
        message,
        data,
        meta,
    };
};

export const formatDataPagination = (
    data,
    page,
    limit,
    totalItems,
    sort = null,
    order = null,
    query = null,
    tenor_min = null,
    tenor_max = null,
    yield_min = null,
    yield_max = null,
    path = null,
) => {
    const URL = `${config.PROJECT_URL}/${path}`;
    const isNextPage = totalItems > page * limit;
    const isPreviousPage = page > 1;

    const paginationURL = (pageNumber) => {
        let queryParamsFilter = '';
        if (query) {
            queryParamsFilter = `&q=${query.trim().replace(/\s/g, '+')}`;
        }
        if (tenor_min) {
            queryParamsFilter += `&tenor_min=${tenor_min}`;
        }
        if (tenor_max) {
            queryParamsFilter += `&tenor_max=${tenor_max}`;
        }
        if (yield_min) {
            queryParamsFilter += `&yield_min=${yield_min}`;
        }
        if (yield_max) {
            queryParamsFilter += `&yield_max=${yield_max}`;
        }
        if (sort && order) {
            return `${URL}?page=${pageNumber}&limit=${limit}&sort=${sort}&order=${order}${queryParamsFilter}`;
        }
        return `${URL}?page=${pageNumber}&limit=${limit}${queryParamsFilter}`;
        // query = query ? `&q=${query.trim().replace(/\s/g, '+')}` : '';
        // console.log('QUERY', query);
        // if (sort && order) {
        //     return `${URL}?page=${pageNumber}&limit=${limit}&sort=${sort}&order=${order}${query}`;
        // }
        // return `${URL}?page=${pageNumber}&limit=${limit}${query}`;
    };

    return {
        data,
        meta: {
            pagination: {
                currentPage: page,
                nextPage: isNextPage ? `${paginationURL(page + 1)}` : null,
                previousPage: isPreviousPage
                    ? `${paginationURL(page - 1)}`
                    : null,
                totalPages: Math.ceil(totalItems / limit),
                limit,
            },
            totalItems,
        },
    };
};
