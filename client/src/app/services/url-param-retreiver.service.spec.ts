import { TestBed } from '@angular/core/testing';

import { UrlParamRetrieverService } from './url-param-retriever.service';

describe('UrlParamRetrieverService', () => {
    let service: UrlParamRetrieverService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(UrlParamRetrieverService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });
});
