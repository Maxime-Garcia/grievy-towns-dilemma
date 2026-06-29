using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class EarthUltimate : MonoBehaviour, InterfaceSpell
{

    public bool ActiveUltimate;
    public float Delay;
    public GameObject FirstRing;
    public GameObject SecondRing;
    public GameObject ThirdRing;
    public GameObject FourthRing;
    public GameObject FifthRing;
    public GameObject SixthRing;
    public GameObject SeventhRing;

    private void Update()
    {
        //check boss Health here -> ActivateUlti = true;

        if (ActiveUltimate)
        {
            StartCoroutine(Ultimate());
            ActiveUltimate = false;
        }
    }

    private IEnumerator Ultimate()
    {
        print("Ultimate");
        Transform pos = transform;
        
        
        GameObject circle1 = Instantiate(FirstRing)as GameObject;
        yield return new WaitForSeconds(Delay);
        GameObject circle2 = Instantiate(SecondRing)as GameObject;
        yield return new WaitForSeconds(Delay);
        GameObject circle3 = Instantiate(ThirdRing)as GameObject;
        yield return new WaitForSeconds(Delay);
        GameObject circle4 = Instantiate(FourthRing)as GameObject;
        yield return new WaitForSeconds(Delay);
        GameObject circle5 = Instantiate(FifthRing)as GameObject;
        yield return new WaitForSeconds(Delay);
        GameObject circle6 = Instantiate(SixthRing)as GameObject;
        yield return new WaitForSeconds(Delay);
        GameObject circle7 = Instantiate(SeventhRing)as GameObject;

        yield return new WaitForSeconds(3);
        foreach(GameObject i in GameObject.FindGameObjectsWithTag("EarthRing"))
        {
            Destroy(i);
        }
    }

    public void lunchUlti(){
      ActiveUltimate = true;
    }

    public void ActivateUltimateF()
    {
        ActiveUltimate = true;
    }
}
