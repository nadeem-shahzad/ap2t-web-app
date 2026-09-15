import { EmblaOptionsType } from 'embla-carousel';
import useEmblaCarousel from 'embla-carousel-react';

import { EmblaCarouselType } from 'embla-carousel';
import { ChevronLeft, ChevronRight, Quote, Star, User } from 'lucide-react';
import React, { ComponentPropsWithRef, ReactNode, useCallback, useEffect, useState } from 'react';
import { Avatar } from '../ui/avatar';
import { Card, CardContent, CardFooter, CardHeader } from '../ui/card';

export type ReviewLanding = {
  star: number;
  title: string;
  description: string;
  person: {
    name: string;
    details: string;
  };
};

type PropType = {
  slides: ReviewLanding[];
  options?: EmblaOptionsType;
  children: ReactNode;
};

const TestimonialSlider: React.FC<PropType> = (props) => {
  const { slides, options, children } = props;
  const [emblaRef, emblaApi] = useEmblaCarousel(options);

  const { prevBtnDisabled, nextBtnDisabled, onPrevButtonClick, onNextButtonClick } =
    usePrevNextButtons(emblaApi);

  return (
    <>
      <div className="flex justify-between gap-4 flex-wrap items-start">
        <div>{children}</div>
        <div className="embla__controls">
          <div className="embla__buttons gap-2 flex">
            <PrevButton onClick={onPrevButtonClick} disabled={prevBtnDisabled}>
              <div className="h-7 w-7 flex items-center justify-center border rounded-full">
                <ChevronLeft size={14} />
              </div>
            </PrevButton>
            <NextButton onClick={onNextButtonClick} disabled={nextBtnDisabled}>
              <div className="h-7 w-7 flex items-center justify-center border rounded-full">
                <ChevronRight size={14} />
              </div>
            </NextButton>
          </div>
        </div>
      </div>
      <section className="embla responsive-slide">
        <div className="embla__viewport" ref={emblaRef}>
          <div className="embla__container">
            {slides.map((review, index) => (
              <div className="embla__slide" key={index}>
                <div className="embla__slide__number" style={{ boxShadow: 'none' }}>
                  <Card className="bg-[#141414] rounded-[10px] w-md">
                    <CardHeader>
                      <div className="flex gap-1">
                        {Array.from({ length: review.star }).map((_, i) => (
                          <Star key={i} className="w-5 h-5 fill-primary text-[#FDC700]" />
                        ))}
                      </div>
                    </CardHeader>

                    <CardContent>
                      <h1 className="font-bold text-2xl">"{review.title}"</h1>
                      <p className="text-[#A3A3A3] text-sm">{review.description}</p>
                    </CardContent>

                    <CardFooter>
                      <div className="w-full h-12 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <Avatar className="flex items-center justify-center">{<User />}</Avatar>

                          <div>
                            <h1 className="text-xl">{review.person.name}</h1>
                            <p className="text-sm text-[#A3A3A3]">{review.person.details}</p>
                          </div>
                        </div>

                        <Quote className="text-5xl text-[#CBFD0026]" />
                      </div>
                    </CardFooter>
                  </Card>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
};

type UsePrevNextButtonsType = {
  prevBtnDisabled: boolean;
  nextBtnDisabled: boolean;
  onPrevButtonClick: () => void;
  onNextButtonClick: () => void;
};

export const usePrevNextButtons = (
  emblaApi: EmblaCarouselType | undefined
): UsePrevNextButtonsType => {
  const [prevBtnDisabled, setPrevBtnDisabled] = useState(true);
  const [nextBtnDisabled, setNextBtnDisabled] = useState(true);

  const onPrevButtonClick = useCallback(() => {
    if (!emblaApi) return;
    emblaApi.scrollPrev();
  }, [emblaApi]);

  const onNextButtonClick = useCallback(() => {
    if (!emblaApi) return;
    emblaApi.scrollNext();
  }, [emblaApi]);

  const onSelect = useCallback((emblaApi: EmblaCarouselType) => {
    setPrevBtnDisabled(!emblaApi.canScrollPrev());
    setNextBtnDisabled(!emblaApi.canScrollNext());
  }, []);

  useEffect(() => {
    if (!emblaApi) return;

    onSelect(emblaApi);
    emblaApi.on('reInit', onSelect).on('select', onSelect);
  }, [emblaApi, onSelect]);

  return {
    prevBtnDisabled,
    nextBtnDisabled,
    onPrevButtonClick,
    onNextButtonClick,
  };
};

type PropTypeBtn = ComponentPropsWithRef<'button'>;

export const PrevButton: React.FC<PropTypeBtn> = (props) => {
  const { children, ...restProps } = props;

  return (
    <button
      className="embla__button embla__button--prev cursor-pointer"
      type="button"
      {...restProps}
    >
      {/* <svg className="embla__button__svg" viewBox="0 0 532 532">
        <path
          fill="currentColor"
          d="M355.66 11.354c13.793-13.805 36.208-13.805 50.001 0 13.785 13.804 13.785 36.238 0 50.034L201.22 266l204.442 204.61c13.785 13.805 13.785 36.239 0 50.044-13.793 13.796-36.208 13.796-50.002 0a5994246.277 5994246.277 0 0 0-229.332-229.454 35.065 35.065 0 0 1-10.326-25.126c0-9.2 3.393-18.26 10.326-25.2C172.192 194.973 332.731 34.31 355.66 11.354Z"
        />
      </svg> */}
      {children}
    </button>
  );
};

export const NextButton: React.FC<PropTypeBtn> = (props) => {
  const { children, ...restProps } = props;

  return (
    <button
      className="embla__button embla__button--next cursor-pointer"
      type="button"
      {...restProps}
    >
      {/* <svg className="embla__button__svg" viewBox="0 0 532 532">
        <path
          fill="currentColor"
          d="M176.34 520.646c-13.793 13.805-36.208 13.805-50.001 0-13.785-13.804-13.785-36.238 0-50.034L330.78 266 126.34 61.391c-13.785-13.805-13.785-36.239 0-50.044 13.793-13.796 36.208-13.796 50.002 0 22.928 22.947 206.395 206.507 229.332 229.454a35.065 35.065 0 0 1 10.326 25.126c0 9.2-3.393 18.26-10.326 25.2-45.865 45.901-206.404 206.564-229.332 229.52Z"
        />
      </svg> */}
      {children}
    </button>
  );
};

type UseDotButtonType = {
  selectedIndex: number;
  scrollSnaps: number[];
  onDotButtonClick: (index: number) => void;
};

export const useDotButton = (emblaApi: EmblaCarouselType | undefined): UseDotButtonType => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([]);

  const onDotButtonClick = useCallback(
    (index: number) => {
      if (!emblaApi) return;
      emblaApi.scrollTo(index);
    },
    [emblaApi]
  );

  const onInit = useCallback((emblaApi: EmblaCarouselType) => {
    setScrollSnaps(emblaApi.scrollSnapList());
  }, []);

  const onSelect = useCallback((emblaApi: EmblaCarouselType) => {
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, []);

  useEffect(() => {
    if (!emblaApi) return;

    onInit(emblaApi);
    onSelect(emblaApi);
    emblaApi.on('reInit', onInit).on('reInit', onSelect).on('select', onSelect);
  }, [emblaApi, onInit, onSelect]);

  return {
    selectedIndex,
    scrollSnaps,
    onDotButtonClick,
  };
};

type PropTypeDot = ComponentPropsWithRef<'button'>;

export const DotButton: React.FC<PropTypeDot> = (props) => {
  const { children, ...restProps } = props;

  return (
    <button type="button" {...restProps}>
      {children}
    </button>
  );
};

export default TestimonialSlider;
